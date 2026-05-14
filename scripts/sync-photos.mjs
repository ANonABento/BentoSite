// Auto-generate public/photos/manifest.json from the photo files on disk.
// For each image (jpg/jpeg/png/webp) in public/photos/:
//   - read width/height via sharp
//   - read sidecar metadata from <basename>.json (title, location, year, alt)
//   - skip the image (with a warning) if no sidecar exists
//
// Drop in a new photo + its sidecar JSON, run `npm run sync:photos`, done.

import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const PHOTOS_DIR = path.join(process.cwd(), 'public', 'photos');
const MANIFEST_PATH = path.join(PHOTOS_DIR, 'manifest.json');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function readSidecar(imagePath) {
  const sidecarPath = imagePath.replace(/\.(jpg|jpeg|png|webp)$/i, '.json');
  try {
    const raw = await fs.readFile(sidecarPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new Error(`Failed to parse sidecar ${path.basename(sidecarPath)}: ${error.message}`);
  }
}

function validateSidecar(meta, source) {
  const errors = [];
  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
    return [`${source}: expected a JSON object with title/location/year/alt`];
  }
  for (const key of ['title', 'location', 'year', 'alt']) {
    if (typeof meta[key] !== 'string' || meta[key].trim().length === 0) {
      errors.push(`${source}.${key}: expected a non-empty string`);
    }
  }
  return errors;
}

async function main() {
  let entries;
  try {
    entries = await fs.readdir(PHOTOS_DIR, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No public/photos/ directory; skipping photo sync.');
      return;
    }
    throw error;
  }

  const imageFiles = entries
    .filter((entry) => entry.isFile() && IMAGE_EXTS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort();

  const photos = [];
  const errors = [];
  const warnings = [];

  for (const file of imageFiles) {
    const fullPath = path.join(PHOTOS_DIR, file);

    let dimensions;
    try {
      const metadata = await sharp(fullPath).metadata();
      dimensions = { width: metadata.width, height: metadata.height };
    } catch (error) {
      errors.push(`${file}: could not read image dimensions — ${error.message}`);
      continue;
    }

    if (!dimensions.width || !dimensions.height) {
      errors.push(`${file}: missing width/height in image metadata`);
      continue;
    }

    let meta;
    try {
      meta = await readSidecar(fullPath);
    } catch (error) {
      errors.push(error.message);
      continue;
    }

    if (!meta) {
      warnings.push(
        `${file}: no sidecar metadata; skipped. Create ${file.replace(/\.[^.]+$/, '.json')} with {title, location, year, alt}.`
      );
      continue;
    }

    const sidecarErrors = validateSidecar(meta, file.replace(/\.[^.]+$/, '.json'));
    if (sidecarErrors.length > 0) {
      for (const err of sidecarErrors) errors.push(err);
      continue;
    }

    photos.push({
      id: slugify(path.basename(file, path.extname(file))),
      src: `/photos/${file}`,
      alt: meta.alt,
      title: meta.title,
      location: meta.location,
      year: meta.year,
      width: dimensions.width,
      height: dimensions.height,
    });
  }

  for (const warning of warnings) console.warn(`⚠ ${warning}`);

  if (errors.length > 0) {
    console.error('Photo sync failed:');
    for (const err of errors) console.error(`- ${err}`);
    process.exitCode = 1;
    return;
  }

  // Sort: newest year first, then by title for stable order.
  photos.sort((a, b) => {
    const yearDiff = String(b.year).localeCompare(String(a.year));
    if (yearDiff !== 0) return yearDiff;
    return a.title.localeCompare(b.title);
  });

  await fs.writeFile(MANIFEST_PATH, JSON.stringify({ photos }, null, 2) + '\n', 'utf8');
  console.log(`Wrote manifest.json with ${photos.length} photos.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
