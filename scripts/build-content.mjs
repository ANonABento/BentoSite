// Build script for portfolio content.
// Globs src/content/projects/*.json + src/content/talking-points/*.json,
// validates each, sorts, and writes generated bundles consumed by the app.
// Run by `npm run sync:projects` and the prebuild hook.

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { validateProject, validateTalkingPoint } from './content-schema.mjs';

const ROOT = process.cwd();
const PROJECTS_DIR = path.join(ROOT, 'src', 'content', 'projects');
const TALKING_POINTS_DIR = path.join(ROOT, 'src', 'content', 'talking-points');
const PROJECTS_OUT = path.join(ROOT, 'src', 'content', 'projects.generated.json');
const TALKING_POINTS_OUT = path.join(ROOT, 'src', 'content', 'talking-points.generated.json');

function projectTimestamp(project) {
  if (!project.dateCompleted) return 0;
  const [yearString, monthString = '1'] = project.dateCompleted.split('-');
  const year = Number(yearString);
  const month = Number(monthString);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return 0;
  return Date.UTC(year, month - 1, 1);
}

/**
 * Write a generated bundle, preserving the previous `generatedAt` when nothing
 * else changed.
 *
 * These files are committed, and `npm run dev` / `npm run build` regenerate
 * them on every run. Stamping a fresh timestamp each time left the working
 * tree permanently dirty — it blocks branch switches and means any content
 * commit picks up two timestamp-only diffs it did not intend.
 */
export async function writeGeneratedBundle(file, payload) {
  let previous = null;
  try {
    previous = JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    previous = null;
  }

  const next = { generatedAt: new Date().toISOString(), ...payload };
  if (previous) {
    const { generatedAt: _previousStamp, ...previousRest } = previous;
    const { generatedAt: _nextStamp, ...nextRest } = next;
    if (JSON.stringify(previousRest) === JSON.stringify(nextRest)) {
      next.generatedAt = previous.generatedAt;
    }
  }

  await fs.writeFile(file, JSON.stringify(next, null, 2) + '\n', 'utf8');
}

async function readJsonFiles(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const results = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const fullPath = path.join(dir, entry.name);
    const raw = await fs.readFile(fullPath, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`${entry.name}: invalid JSON — ${error.message}`);
    }
    results.push({ name: entry.name, parsed, basename: entry.name.replace(/\.json$/, '') });
  }
  return results;
}

async function buildProjects() {
  const files = await readJsonFiles(PROJECTS_DIR);
  const errors = [];
  const seenIds = new Set();
  const projects = [];

  for (const { name, parsed, basename } of files) {
    if (parsed && parsed.id !== basename) {
      errors.push(`${name}: id field "${parsed.id}" must match filename "${basename}"`);
      continue;
    }
    if (seenIds.has(basename)) {
      errors.push(`${name}: duplicate id "${basename}"`);
      continue;
    }
    seenIds.add(basename);

    const projectErrors = validateProject(parsed, name);
    if (projectErrors.length > 0) {
      for (const err of projectErrors) errors.push(`${name}: ${err}`);
      continue;
    }
    projects.push(parsed);
  }

  if (errors.length > 0) {
    return { errors, count: 0 };
  }

  // Ordering model: projects carrying an explicit `order` (set by the Studio's
  // drag-to-reorder list) come first, lowest first — those are the ones that
  // land in the prime grid positions. Everything else follows newest-first, so
  // adding a project without touching the list still puts it somewhere sane.
  projects.sort((a, b) => {
    const aOrder = typeof a.order === 'number' ? a.order : Number.POSITIVE_INFINITY;
    const bOrder = typeof b.order === 'number' ? b.order : Number.POSITIVE_INFINITY;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return projectTimestamp(b) - projectTimestamp(a);
  });

  await writeGeneratedBundle(PROJECTS_OUT, { projects });
  return { errors: [], count: projects.length };
}

async function buildTalkingPoints() {
  const files = await readJsonFiles(TALKING_POINTS_DIR);
  const errors = [];
  const seenIds = new Set();
  const points = [];

  for (const { name, parsed, basename } of files) {
    if (parsed && parsed.id !== basename) {
      errors.push(`${name}: id field "${parsed.id}" must match filename "${basename}"`);
      continue;
    }
    if (seenIds.has(basename)) {
      errors.push(`${name}: duplicate id "${basename}"`);
      continue;
    }
    seenIds.add(basename);

    const pointErrors = validateTalkingPoint(parsed, name);
    if (pointErrors.length > 0) {
      for (const err of pointErrors) errors.push(`${name}: ${err}`);
      continue;
    }
    points.push(parsed);
  }

  if (errors.length > 0) {
    return { errors, count: 0 };
  }

  points.sort((a, b) => a.id.localeCompare(b.id));

  await writeGeneratedBundle(TALKING_POINTS_OUT, { points });
  return { errors: [], count: points.length };
}

async function main() {
  const projects = await buildProjects();
  const talkingPoints = await buildTalkingPoints();

  const allErrors = [...projects.errors, ...talkingPoints.errors];
  if (allErrors.length > 0) {
    console.error('Content build failed:');
    for (const err of allErrors) console.error(`- ${err}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Wrote ${projects.count} projects and ${talkingPoints.count} talking points to src/content/.`
  );
}

// Only build when run as a script. `writeGeneratedBundle` is imported by tests,
// and importing this module used to rebuild the repo's real content as a side
// effect of that import.
const isEntrypoint =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
