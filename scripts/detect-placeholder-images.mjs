// Placeholder-imagery detector for the launch audit.
//
// The content audit could only see whether a file existed, so a photo gallery
// of generated colour blocks passed as "0 blocking gaps". A photograph carries
// hundreds of distinct colours even after heavy quantisation; flat generated
// art carries a dozen. Downscale, quantise, and count.
//
// This heuristic is applied to `public/photos` ONLY. Project imagery is often a
// legitimately flat UI screenshot — `bento-ya/hero.png` is a real screenshot
// that quantises to 15 colours — so generated project covers are tracked
// explicitly instead, in the manifest `generate-project-cover.mjs` maintains.

import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const ROOT = process.cwd();

/** Distinct quantised colours at or below this count reads as generated art. */
export const PLACEHOLDER_COLOR_THRESHOLD = 40;

const SAMPLE_SIZE = 64;
const QUANTISE_SHIFT = 4; // 16 levels per channel

export async function countDistinctColors(file) {
  const { data, info } = await sharp(file)
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const seen = new Set();
  for (let index = 0; index < data.length; index += info.channels) {
    const r = data[index] >> QUANTISE_SHIFT;
    const g = data[index + 1] >> QUANTISE_SHIFT;
    const b = data[index + 2] >> QUANTISE_SHIFT;
    seen.add((r << 8) | (g << 4) | b);
  }
  return seen.size;
}

export async function isPlaceholderImage(file) {
  const colors = await countDistinctColors(file);
  return { colors, placeholder: colors <= PLACEHOLDER_COLOR_THRESHOLD };
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

async function walkImages(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkImages(full)));
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

export const GENERATED_COVERS_MANIFEST = path.join(
  ROOT,
  'public',
  'projects',
  'generated-covers.json',
);

/** Projects whose hero image is a generated placeholder, not a real capture. */
export async function readGeneratedCovers() {
  try {
    const raw = await fs.readFile(GENERATED_COVERS_MANIFEST, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.covers) ? parsed.covers : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function recordGeneratedCover(projectId, file) {
  const covers = await readGeneratedCovers();
  const relative = path.relative(ROOT, file);
  const next = covers.filter((cover) => cover.projectId !== projectId);
  next.push({ projectId, file: relative });
  next.sort((a, b) => a.projectId.localeCompare(b.projectId));
  await fs.writeFile(
    GENERATED_COVERS_MANIFEST,
    JSON.stringify(
      {
        note: 'Projects still using a generated placeholder cover. Replace with a real capture, then drop the entry.',
        covers: next,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  return next;
}

/**
 * Scan the photo gallery for generated placeholder art.
 * Returns { photos: [...] }.
 */
export async function scanPlaceholderPhotos() {
  const photoFiles = await walkImages(path.join(ROOT, 'public', 'photos'));
  const photos = [];

  for (const file of photoFiles) {
    const { colors, placeholder } = await isPlaceholderImage(file);
    if (placeholder) {
      photos.push({ file: path.relative(ROOT, file), colors });
    }
  }

  return { photos };
}
