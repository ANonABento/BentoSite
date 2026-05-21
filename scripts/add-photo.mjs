// Choomfie-friendly photo ingestion.
//
// Copies an image into public/photos/, strips metadata while preserving visual
// orientation, writes the required sidecar JSON, and can optionally rebuild
// the manifest. Designed for non-interactive Discord/agent calls.

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import sharp from 'sharp';

import {
  optionalString,
  parseArgs,
  pathExists,
  printResult,
  requireString,
  slugify,
  usage,
  writeJson,
} from './content-cli-utils.mjs';

const ROOT = process.cwd();
const PHOTOS_DIR = path.join(ROOT, 'public', 'photos');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const DEFAULT_MAX_EDGE = 2400;

function showHelp() {
  usage(`
Usage:
  node scripts/add-photo.mjs --src <image> --title <title> --location <place> --year <yyyy> --alt <alt> [options]

Options:
  --slug <slug>          Filename slug. Defaults to title, then source basename.
  --max-edge <px>        Resize longest edge down to this value. Default: 2400.
  --overwrite            Replace an existing image/sidecar with the same slug.
  --sync                 Run npm run sync after writing files.
  --dry-run              Validate and print the planned result without writing.
  --json                 Print machine-readable JSON.

Example:
  npm run add:photo -- --src /tmp/tokyo.jpg --title "Shinjuku Night" --location "Tokyo, Japan" --year 2026 --alt "Neon-lit street with tall signs and pedestrians."
`);
}

function normalizeExt(sourcePath) {
  const ext = path.extname(sourcePath).toLowerCase();
  if (ext === '.jpeg') return '.jpg';
  return ext;
}

function assertYear(value) {
  if (!/^\d{4}$/.test(value)) {
    throw new Error('--year must be a four-digit year, e.g. 2026');
  }
}

async function prepareImage(sourcePath, targetPath, maxEdge, dryRun) {
  const input = sharp(sourcePath, { failOn: 'warning' });
  const metadata = await input.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read image dimensions from ${sourcePath}`);
  }

  if (dryRun) {
    return {
      sourceWidth: metadata.width,
      sourceHeight: metadata.height,
      hadMetadata: Boolean(metadata.exif || metadata.icc || metadata.iptc || metadata.xmp),
    };
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await sharp(sourcePath, { failOn: 'warning' })
    .rotate()
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toFile(targetPath);

  return {
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    hadMetadata: Boolean(metadata.exif || metadata.icc || metadata.iptc || metadata.xmp),
  };
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

  const sourceArg = requireString(args, 'src');
  const title = requireString(args, 'title');
  const location = requireString(args, 'location');
  const year = String(requireString(args, 'year'));
  const alt = requireString(args, 'alt');
  const json = Boolean(args.json);
  const dryRun = Boolean(args['dry-run']);
  const overwrite = Boolean(args.overwrite);
  const shouldSync = Boolean(args.sync);
  const maxEdgeRaw = optionalString(args, 'max-edge');
  const maxEdge = maxEdgeRaw ? Number(maxEdgeRaw) : DEFAULT_MAX_EDGE;

  assertYear(year);
  if (!Number.isFinite(maxEdge) || maxEdge < 320 || maxEdge > 8000) {
    throw new Error('--max-edge must be a number between 320 and 8000');
  }

  const sourcePath = path.resolve(ROOT, sourceArg);
  if (!(await pathExists(sourcePath))) {
    throw new Error(`Source image does not exist: ${sourceArg}`);
  }

  const ext = normalizeExt(sourcePath);
  if (!IMAGE_EXTS.has(ext)) {
    throw new Error(`Unsupported image extension "${ext}". Use jpg, png, or webp.`);
  }

  const rawSlug = optionalString(args, 'slug') ?? title ?? path.basename(sourcePath, path.extname(sourcePath));
  const slug = slugify(rawSlug);
  if (!slug) throw new Error('Could not derive a valid photo slug');

  const targetImage = path.join(PHOTOS_DIR, `${slug}${ext}`);
  const targetSidecar = path.join(PHOTOS_DIR, `${slug}.json`);
  const relativeImage = path.relative(ROOT, targetImage);
  const relativeSidecar = path.relative(ROOT, targetSidecar);

  const imageExists = await pathExists(targetImage);
  const sidecarExists = await pathExists(targetSidecar);
  if (!overwrite && (imageExists || sidecarExists)) {
    throw new Error(
      `Refusing to overwrite existing ${imageExists ? relativeImage : relativeSidecar}. Pass --overwrite if intentional.`,
    );
  }

  const imageInfo = await prepareImage(sourcePath, targetImage, maxEdge, dryRun);
  const sidecar = { title, location, year, alt };
  await writeJson(targetSidecar, sidecar, { dryRun });

  let syncOutput;
  if (shouldSync && !dryRun) {
    syncOutput = runSync();
  }

  const warnings = [];
  if (imageInfo.hadMetadata) {
    warnings.push('Source image contained metadata; the written image was re-encoded without EXIF/GPS metadata.');
  }
  if (!shouldSync) {
    warnings.push('Manifest and launch report not regenerated. Run npm run sync before committing.');
  }

  printResult(
    {
      ok: true,
      message: dryRun ? `Would add photo "${title}" as ${slug}${ext}` : `Added photo "${title}" as ${slug}${ext}`,
      id: slug,
      src: `/photos/${slug}${ext}`,
      sidecar,
      source: sourcePath,
      dimensions: imageInfo,
      files: [relativeImage, relativeSidecar, ...(shouldSync ? ['public/photos/manifest.json'] : [])],
      warnings,
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
