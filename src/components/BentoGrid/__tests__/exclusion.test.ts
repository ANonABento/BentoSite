import { describe, expect, it } from 'vitest';
import type { CardPosition } from '../BentoGrid.types';
import {
  preserveLayoutWithExclusion,
  rectsOverlap,
} from '../layout';

describe('preserveLayoutWithExclusion', () => {
  const basePosition: CardPosition = {
    x: 0,
    y: 0,
    width: 180,
    height: 180,
    rotation: 0,
    size: '1x1',
  };

  it('keeps cards that do not overlap the exclusion zone in place', () => {
    const currentPositions = new Map<string, CardPosition>([
      ['safe', { ...basePosition, x: 500, y: 0 }],
      ['blocked', { ...basePosition, x: 0, y: 0 }],
    ]);
    const exclusionZone = {
      x: -20,
      y: -20,
      width: 220,
      height: 220,
      padding: 0,
    };

    const positions = preserveLayoutWithExclusion(currentPositions, exclusionZone);

    expect(positions.get('safe')).toMatchObject(currentPositions.get('safe')!);
    expect(rectsOverlap(positions.get('blocked')!, exclusionZone, 0)).toBe(false);
  });

  it('preserves size and rotation while resolving card-card overlaps', () => {
    const currentPositions = new Map<string, CardPosition>([
      ['first', { ...basePosition, x: 0, y: 0, rotation: 3, size: '1x1' }],
      ['second', { ...basePosition, x: 0, y: 0, rotation: -2, size: '1x1' }],
    ]);
    const exclusionZone = {
      x: 500,
      y: 500,
      width: 100,
      height: 100,
      padding: 0,
    };
    const positions = preserveLayoutWithExclusion(currentPositions, exclusionZone);
    const first = positions.get('first')!;
    const second = positions.get('second')!;

    expect(first).toMatchObject({
      width: basePosition.width,
      height: basePosition.height,
      rotation: 3,
      size: '1x1',
    });
    expect(second).toMatchObject({
      width: basePosition.width,
      height: basePosition.height,
      rotation: -2,
      size: '1x1',
    });
    expect(rectsOverlap(first, second)).toBe(false);
  });
});
