// Non-interactive talking-point writer for the portfolio chat knowledge base.

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { validateTalkingPoint } from './content-schema.mjs';
import {
  optionalString,
  parseArgs,
  parseStringList,
  pathExists,
  printResult,
  requireString,
  slugify,
  usage,
  writeJson,
} from './content-cli-utils.mjs';

const ROOT = process.cwd();
const TALKING_POINTS_DIR = path.join(ROOT, 'src', 'content', 'talking-points');

function showHelp() {
  usage(`
Usage:
  node scripts/add-talking-point.mjs --title <title> --content <content> --keywords <csv> [options]

Options:
  --id <slug>       Talking point id. Defaults to title slug.
  --overwrite       Replace an existing talking point with the same id.
  --sync            Run npm run sync after writing.
  --dry-run         Validate and print the planned result without writing.
  --json            Print machine-readable JSON.

Example:
  npm run add:talking-point -- --title "Work Style" --content "Kevin likes..." --keywords "work style, collaboration, engineering"
`);
}

function runSync() {
  const result = spawnSync('npm', ['run', 'sync'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`sync failed${detail ? `:\n${detail}` : ''}`);
  }

  return [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
}

async function main() {
  const args = parseArgs();
  if (args.help || args.h) {
    showHelp();
    return;
  }

  const title = requireString(args, 'title');
  const content = requireString(args, 'content');
  const keywords = parseStringList(requireString(args, 'keywords'));
  const id = slugify(optionalString(args, 'id') ?? title, { maxLength: 60 });
  const dryRun = Boolean(args['dry-run']);
  const overwrite = Boolean(args.overwrite);
  const shouldSync = Boolean(args.sync);
  const json = Boolean(args.json);

  if (!id) throw new Error('Could not derive a valid talking-point id');
  if (keywords.length === 0) throw new Error('--keywords must contain at least one comma-separated keyword');

  const point = {
    id,
    title,
    content,
    keywords: Array.from(new Set(keywords)).slice(0, 20),
  };

  const errors = validateTalkingPoint(point, `${id}.json`);
  if (errors.length > 0) {
    throw new Error(`Talking point is invalid:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }

  const target = path.join(TALKING_POINTS_DIR, `${id}.json`);
  const relativeTarget = path.relative(ROOT, target);
  if (!overwrite && await pathExists(target)) {
    throw new Error(`Refusing to overwrite existing ${relativeTarget}. Pass --overwrite if intentional.`);
  }

  await fs.mkdir(TALKING_POINTS_DIR, { recursive: true });
  await writeJson(target, point, { dryRun });

  let syncOutput;
  if (shouldSync && !dryRun) {
    syncOutput = runSync();
  }

  printResult(
    {
      ok: true,
      message: dryRun ? `Would add talking point "${title}"` : `Added talking point "${title}"`,
      id,
      point,
      files: [relativeTarget, ...(shouldSync ? ['src/content/talking-points.generated.json'] : [])],
      syncOutput,
      next: shouldSync ? ['Run npm test before committing.'] : ['Run npm run sync', 'Run npm test'],
    },
    { json },
  );
}

main().catch((error) => {
  const args = parseArgs();
  if (args.json) {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  } else {
    console.error(error instanceof Error ? error.message : String(error));
  }
  process.exitCode = 1;
});
