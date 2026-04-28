import { describe, expect, it } from 'vitest';
import type { CardData } from '../BentoGrid.types';
import { calculateLayoutWithExclusion, rectsOverlap } from '../layout';

const cards: CardData[] = Array.from({ length: 8 }, (_, index) => ({
  id: `project-${index}`,
  type: 'project' as const,
  title: `Project ${index}`,
}));

describe('calculateLayoutWithExclusion', () => {
  it('places cards outside the padded exclusion zone', () => {
    const exclusionZone = {
      x: -190,
      y: -90,
      width: 380,
      height: 180,
      padding: 24,
    };
    const positions = calculateLayoutWithExclusion(cards, exclusionZone, 0);
    const paddedExclusion = {
      x: exclusionZone.x - exclusionZone.padding,
      y: exclusionZone.y - exclusionZone.padding,
      width: exclusionZone.width + exclusionZone.padding * 2,
      height: exclusionZone.height + exclusionZone.padding * 2,
    };

    expect(positions.size).toBe(cards.length);

    positions.forEach((position) => {
      expect(rectsOverlap(position, paddedExclusion, 0)).toBe(false);
    });
  });
});
