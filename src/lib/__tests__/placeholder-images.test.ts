import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';

// Plain ESM script module, shared with the CLI tooling.
import { PLACEHOLDER_COLOR_THRESHOLD, countDistinctColors, isPlaceholderImage } from '../../../scripts/detect-placeholder-images.mjs';

/**
 * The launch audit reported "0 blocking gaps" while six of the twelve photos in
 * the gallery were generated colour blocks. This is the check that catches that
 * class of problem, so it needs its own coverage: flat art must trip it, and
 * photographic noise must not.
 */

let dir: string;
let flatFile: string;
let noisyFile: string;

beforeAll(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'placeholder-test-'));
  flatFile = path.join(dir, 'flat.png');
  noisyFile = path.join(dir, 'noisy.png');

  // A few solid rectangles — the shape of the generated "photos".
  await sharp({
    create: { width: 400, height: 300, channels: 3, background: { r: 30, g: 20, b: 40 } },
  })
    .composite([
      {
        input: await sharp({
          create: { width: 200, height: 150, channels: 3, background: { r: 120, g: 60, b: 20 } },
        })
          .png()
          .toBuffer(),
        top: 40,
        left: 40,
      },
    ])
    .png()
    .toFile(flatFile);

  // Per-pixel noise stands in for photographic detail.
  const width = 400;
  const height = 300;
  const raw = Buffer.alloc(width * height * 3);
  for (let index = 0; index < raw.length; index += 3) {
    const pixel = index / 3;
    raw[index] = (pixel * 7) % 256;
    raw[index + 1] = (pixel * 13) % 256;
    raw[index + 2] = (pixel * 29) % 256;
  }
  await sharp(raw, { raw: { width, height, channels: 3 } }).png().toFile(noisyFile);
});

afterAll(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe('placeholder image detection', () => {
  it('flags flat generated art', async () => {
    const result = await isPlaceholderImage(flatFile);
    expect(result.placeholder).toBe(true);
    expect(result.colors).toBeLessThanOrEqual(PLACEHOLDER_COLOR_THRESHOLD);
  });

  it('does not flag an image with photographic colour variety', async () => {
    const result = await isPlaceholderImage(noisyFile);
    expect(result.placeholder).toBe(false);
    expect(result.colors).toBeGreaterThan(PLACEHOLDER_COLOR_THRESHOLD);
  });

  it('counts distinct quantised colours, not raw pixels', async () => {
    // 400x300 downsamples to a 64x64 sample, so the count can never exceed the
    // 4096-entry quantised space regardless of input size.
    const colors = await countDistinctColors(noisyFile);
    expect(colors).toBeLessThanOrEqual(4096);
  });
});
