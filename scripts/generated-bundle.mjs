// Writing helper for the committed `*.generated.json` bundles.
// Lives on its own so tests can import it without pulling the whole build
// CLI (and its uncovered branches) along for the ride.

import fs from 'node:fs/promises';

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
