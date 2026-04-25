import { describe, expect, it } from 'vitest';
import { GRID, getCardDimensions } from '../UnifiedGrid.constants';
import type { CardData, CardPosition, ProjectCardData } from '../UnifiedGrid.types';
import { filterCards } from '../core/cardQueue/filter';
import { calculateInitialPositions } from '../core/cardQueue/positions';

const cards: CardData[] = [
  {
    id: 'project-featured',
    type: 'project',
    title: 'Conductor',
    description: 'Main portfolio project',
    category: 'web',
    technologies: ['Next.js', 'TypeScript'],
    featured: true,
  },
  {
    id: 'project-api',
    type: 'project',
    title: 'Signal API',
    description: 'Backend services',
    category: 'backend',
    technologies: ['Node.js', 'PostgreSQL'],
  },
  {
    id: 'game-rhythm',
    type: 'game',
    title: 'Rhythm',
    description: 'Timing game',
    category: 'arcade',
    href: '/playground/rhythm',
  },
  {
    id: 'project-mobile',
    type: 'project',
    title: 'Compass',
    description: 'Mobile app shell',
    category: 'mobile',
    technologies: ['React Native'],
  },
  {
    id: 'game-puzzle',
    type: 'game',
    title: 'Puzzle Box',
    description: 'Grid puzzler',
    category: 'puzzle',
    href: '/playground/puzzle-box',
  },
];

function rectsOverlap(a: CardPosition, b: CardPosition): boolean {
  const padding = GRID.GAP;
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}

describe('filterCards', () => {
  it('trims and lowercases search terms', () => {
    expect(filterCards(cards, '  conductor  ', null).map((card) => card.id)).toEqual([
      'project-featured',
    ]);
  });

  it('matches project technologies while preserving category filters', () => {
    expect(filterCards(cards, 'typescript', null).map((card) => card.id)).toEqual([
      'project-featured',
    ]);
    expect(filterCards(cards, 'typescript', 'backend')).toEqual([]);
  });

  it('does not treat game cards as technology matches', () => {
    expect(filterCards(cards, 'react native', null).map((card) => card.id)).toEqual([
      'project-mobile',
    ]);
    expect(filterCards(cards, 'postgresql', 'arcade')).toEqual([]);
  });
});

describe('calculateInitialPositions', () => {
  it('returns the requested number of centered, non-overlapping positions', () => {
    const positions = calculateInitialPositions(cards, 4, 0);
    const values = Array.from(positions.values());

    expect(positions.size).toBe(4);
    values.forEach((position) => {
      expect(position.rotation).toBe(0);
      expect(position).toMatchObject(getCardDimensions(position.size));
    });

    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        expect(rectsOverlap(values[i], values[j])).toBe(false);
      }
    }

    const bounds = values.reduce(
      (acc, position) => ({
        minX: Math.min(acc.minX, position.x),
        maxX: Math.max(acc.maxX, position.x + position.width),
        minY: Math.min(acc.minY, position.y),
        maxY: Math.max(acc.maxY, position.y + position.height),
      }),
      {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      }
    );

    expect((bounds.minX + bounds.maxX) / 2).toBeCloseTo(0);
    expect((bounds.minY + bounds.maxY) / 2).toBeCloseTo(0);
  });

  it('preserves the featured project size pattern', () => {
    const featuredOnly: ProjectCardData[] = [
      {
        id: 'featured',
        type: 'project',
        title: 'Featured',
        category: 'web',
        featured: true,
      },
    ];

    const position = calculateInitialPositions(featuredOnly, 1, 0).get('featured');

    expect(position).toBeDefined();
    expect(position).toMatchObject({
      size: '2x2',
      ...getCardDimensions('2x2'),
    });
  });
});
