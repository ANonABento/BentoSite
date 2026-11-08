// node --test src/components/Prologue/engine/chalk.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { chalkBox, maskCoverage, stampSegment, CHALK } from './chalk.js';

// cloth centres per stroke (world x, y), from prologue.js at 22ba482
const REACH = [0.325, 0.075], S1 = [-0.055, 0.055], S2 = [0.285, 0.155], S3 = [-0.045, 0.095], S4 = [0.325, 0.155];
const soft = [...stampSegment(REACH, S1, CHALK.soft, 7), ...stampSegment(S1, S2, CHALK.soft, 7.5)];
const full = [...stampSegment(S2, S3, 1, 7.9), ...stampSegment(S3, S4, 1, 8.4)];

for (const [name, aspect] of [['16:9', 16 / 9], ['9:16', 9 / 16]]) {
  test(`chalk ${name}: smudged after swipes 1-2, gone after 3-4`, () => {
    const box = chalkBox(aspect);
    const c12 = maskCoverage(box, soft);
    assert.ok(c12 > 0.2 && c12 < 0.8, `swipes 1-2 coverage ${c12}`);
    assert.equal(maskCoverage(box, [...soft, ...full]), 1);
  });
}
