// Content repository — the one place that reads and writes portfolio content.
//
// Both the `npm run add:*` CLIs and the dev-only Studio API (`/api/studio/*`)
// go through here, so there is a single definition of where each kind of
// content lives, how it is validated, and what "save" means. Validation itself
// stays in content-schema.mjs; this module owns the filesystem.
//
// Plain ESM on purpose: the CLIs run under bare node with no TypeScript step.

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import { validatePortfolio, validateProject, validateTalkingPoint } from './content-schema.mjs';

const ROOT = process.cwd();

export const PATHS = {
  projectsDir: path.join(ROOT, 'src', 'content', 'projects'),
  talkingPointsDir: path.join(ROOT, 'src', 'content', 'talking-points'),
  portfolioFile: path.join(ROOT, 'src', 'content', 'portfolio.json'),
  photosDir: path.join(ROOT, 'public', 'photos'),
  projectAssetsDir: path.join(ROOT, 'public', 'projects'),
};

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const DOC_EXTENSIONS = new Set(['.pdf']);
const MODEL_EXTENSIONS = new Set(['.glb', '.gltf', '.stl']);

export class ContentError extends Error {
  constructor(message, { status = 400, details = [] } = {}) {
    super(message);
    this.name = 'ContentError';
    this.status = status;
    this.details = details;
  }
}

// =============================================================================
// HELPERS
// =============================================================================

export function slugifyId(value, { maxLength = 60 } = {}) {
  const slug = String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
  return slug;
}

function assertSafeId(id) {
  const safe = /^[a-z0-9][a-z0-9-]*$/.test(id ?? '');
  if (!safe) {
    throw new ContentError(`Invalid id "${id}" — use lowercase letters, digits, and hyphens.`);
  }
  return id;
}

async function readJsonFile(file) {
  const raw = await fs.readFile(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new ContentError(`${path.relative(ROOT, file)}: invalid JSON — ${error.message}`);
  }
}

async function writeJsonFile(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

async function listJsonIds(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name.replace(/\.json$/, ''))
    .sort();
}

function assertNoErrors(errors, message) {
  if (errors.length > 0) {
    throw new ContentError(message, { details: errors });
  }
}

// =============================================================================
// PROJECTS
// =============================================================================

export async function listProjects() {
  const ids = await listJsonIds(PATHS.projectsDir);
  const projects = [];
  for (const id of ids) {
    projects.push(await readJsonFile(path.join(PATHS.projectsDir, `${id}.json`)));
  }
  // Same ordering the build applies, so the Studio list matches the live grid.
  projects.sort((a, b) => {
    const aOrder = typeof a.order === 'number' ? a.order : Number.POSITIVE_INFINITY;
    const bOrder = typeof b.order === 'number' ? b.order : Number.POSITIVE_INFINITY;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(b.dateCompleted ?? '').localeCompare(String(a.dateCompleted ?? ''));
  });
  return projects;
}

export async function readProject(id) {
  assertSafeId(id);
  const file = path.join(PATHS.projectsDir, `${id}.json`);
  try {
    return await readJsonFile(file);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new ContentError(`Project "${id}" not found.`, { status: 404 });
    }
    throw error;
  }
}

export async function writeProject(project) {
  const id = assertSafeId(project?.id);
  assertNoErrors(validateProject(project, `project ${id}`), `Project "${id}" is not valid.`);
  await writeJsonFile(path.join(PATHS.projectsDir, `${id}.json`), project);
  return project;
}

export async function deleteProject(id) {
  assertSafeId(id);
  await fs.rm(path.join(PATHS.projectsDir, `${id}.json`), { force: true });
  // Assets are deliberately left in place: they are the expensive artifact and
  // a mis-click should not destroy them. `npm run validate:assets` reports
  // orphans.
}

/**
 * Rewrite the explicit ordering. `orderedIds` is the full list, top first.
 * Anything not named keeps falling back to newest-first behind the ordered set.
 */
export async function reorderProjects(orderedIds) {
  if (!Array.isArray(orderedIds)) {
    throw new ContentError('Expected an array of project ids.');
  }
  const known = new Set(await listJsonIds(PATHS.projectsDir));
  const unknown = orderedIds.filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new ContentError(`Unknown project ids: ${unknown.join(', ')}`);
  }

  const ranked = new Map(orderedIds.map((id, index) => [id, index]));
  for (const id of known) {
    const project = await readProject(id);
    const next = ranked.get(id);
    if (next === undefined) {
      if (project.order === undefined) continue;
      delete project.order;
    } else {
      if (project.order === next) continue;
      project.order = next;
    }
    await writeProject(project);
  }
  return orderedIds;
}

// =============================================================================
// TALKING POINTS
// =============================================================================

export async function listTalkingPoints() {
  const ids = await listJsonIds(PATHS.talkingPointsDir);
  const points = [];
  for (const id of ids) {
    points.push(await readJsonFile(path.join(PATHS.talkingPointsDir, `${id}.json`)));
  }
  return points;
}

export async function writeTalkingPoint(point) {
  const id = assertSafeId(point?.id);
  assertNoErrors(
    validateTalkingPoint(point, `talking-point ${id}`),
    `Talking point "${id}" is not valid.`,
  );
  await writeJsonFile(path.join(PATHS.talkingPointsDir, `${id}.json`), point);
  return point;
}

export async function deleteTalkingPoint(id) {
  assertSafeId(id);
  await fs.rm(path.join(PATHS.talkingPointsDir, `${id}.json`), { force: true });
}

// =============================================================================
// PORTFOLIO (bio / skills / experience / education / contact)
// =============================================================================

export async function readPortfolio() {
  return readJsonFile(PATHS.portfolioFile);
}

export async function writePortfolio(payload) {
  // validatePortfolio returns { valid, errors }, unlike the per-item validators.
  assertNoErrors(validatePortfolio(payload).errors, 'portfolio.json is not valid.');
  await writeJsonFile(PATHS.portfolioFile, payload);
  return payload;
}

// =============================================================================
// PHOTOS
// =============================================================================

export async function listPhotos() {
  let entries;
  try {
    entries = await fs.readdir(PATHS.photosDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const photos = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;
    const slug = entry.name.slice(0, -ext.length);
    const sidecarPath = path.join(PATHS.photosDir, `${slug}.json`);
    let sidecar = null;
    try {
      sidecar = await readJsonFile(sidecarPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    photos.push({
      slug,
      file: entry.name,
      src: `/photos/${entry.name}`,
      hasSidecar: sidecar !== null,
      title: sidecar?.title ?? '',
      location: sidecar?.location ?? '',
      year: sidecar?.year ?? '',
      alt: sidecar?.alt ?? '',
    });
  }
  photos.sort((a, b) => String(b.year).localeCompare(String(a.year)) || a.slug.localeCompare(b.slug));
  return photos;
}

const PHOTO_FIELDS = ['title', 'location', 'year', 'alt'];

export async function writePhotoSidecar(slug, meta) {
  assertSafeId(slug);
  const errors = PHOTO_FIELDS.filter(
    (field) => typeof meta?.[field] !== 'string' || meta[field].trim().length === 0,
  ).map((field) => `${field}: expected a non-empty string`);
  assertNoErrors(errors, `Photo "${slug}" is missing metadata.`);

  const sidecar = Object.fromEntries(PHOTO_FIELDS.map((field) => [field, meta[field].trim()]));
  await writeJsonFile(path.join(PATHS.photosDir, `${slug}.json`), sidecar);
  return sidecar;
}

export async function deletePhoto(slug) {
  assertSafeId(slug);
  const entries = await fs.readdir(PATHS.photosDir);
  await Promise.all(
    entries
      .filter((name) => name === `${slug}.json` || name.startsWith(`${slug}.`))
      .map((name) => fs.rm(path.join(PATHS.photosDir, name), { force: true })),
  );
}

// =============================================================================
// BINARY ASSETS
// =============================================================================

function assertAllowedExtension(filename, kind) {
  const ext = path.extname(filename).toLowerCase();
  const allowed =
    kind === 'model' ? MODEL_EXTENSIONS : kind === 'doc' ? DOC_EXTENSIONS : IMAGE_EXTENSIONS;
  if (!allowed.has(ext)) {
    throw new ContentError(
      `Unsupported ${kind} extension "${ext || '(none)'}" — allowed: ${[...allowed].join(', ')}`,
    );
  }
  return ext;
}

/**
 * Store an uploaded file under public/projects/<projectId>/ and return the
 * public-rooted path the content JSON should reference.
 */
export async function saveProjectAsset(projectId, filename, buffer, { kind = 'image' } = {}) {
  assertSafeId(projectId);
  const ext = assertAllowedExtension(filename, kind);
  const base = slugifyId(path.basename(filename, path.extname(filename))) || 'asset';
  const dir = path.join(PATHS.projectAssetsDir, projectId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${base}${ext}`), buffer);
  return `/projects/${projectId}/${base}${ext}`;
}

/** Store an uploaded photo under public/photos/ and return its slug. */
export async function savePhotoFile(filename, buffer) {
  const ext = assertAllowedExtension(filename, 'image');
  const slug = slugifyId(path.basename(filename, path.extname(filename)));
  if (!slug) throw new ContentError('Could not derive a slug from the filename.');
  await fs.mkdir(PATHS.photosDir, { recursive: true });
  await fs.writeFile(path.join(PATHS.photosDir, `${slug}${ext}`), buffer);
  return { slug, src: `/photos/${slug}${ext}` };
}

// =============================================================================
// SYNC
// =============================================================================

/**
 * Run `npm run sync` (regenerate bundles + photo manifest + validate).
 * Resolves with the combined output either way so the caller can show it.
 */
function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: ROOT, env: process.env });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('error', (error) => resolve({ ok: false, output: `${output}\n${error.message}` }));
    child.on('close', (code) => resolve({ ok: code === 0, output: output.trim() }));
  });
}

/**
 * Stage content paths only, commit, and optionally push. Deliberately narrow:
 * the Studio must never sweep unrelated working-tree changes into a commit.
 */
export async function commitContent(message, { push = false } = {}) {
  const trimmed = String(message ?? '').trim();
  if (!trimmed) throw new ContentError('A commit message is required.');

  const paths = [
    'src/content',
    'public/photos',
    'public/projects',
  ];

  const add = await run('git', ['add', '--', ...paths]);
  if (!add.ok) return { ok: false, output: add.output };

  const staged = await run('git', ['diff', '--cached', '--name-only', '--', ...paths]);
  if (!staged.output) {
    return { ok: true, output: 'Nothing to commit — no content changes staged.' };
  }

  // Pathspec-limited commit: without the trailing `-- paths`, this would also
  // sweep in anything else the user happened to have staged, which is exactly
  // what the Studio promises not to do.
  const commit = await run('git', ['commit', '-m', trimmed, '--', ...paths]);
  if (!commit.ok || !push) {
    return { ok: commit.ok, output: `${add.output}\n${commit.output}`.trim() };
  }

  const pushResult = await run('git', ['push']);
  return {
    ok: pushResult.ok,
    output: `${commit.output}\n${pushResult.output}`.trim(),
  };
}

export function runSync({ script = 'sync' } = {}) {
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', script], { cwd: ROOT, env: process.env });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('error', (error) => resolve({ ok: false, output: `${output}\n${error.message}` }));
    child.on('close', (code) => resolve({ ok: code === 0, output: output.trim() }));
  });
}
