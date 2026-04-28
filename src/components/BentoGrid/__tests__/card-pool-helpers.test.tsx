import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CardData, CardPosition, ProjectCardData } from '../BentoGrid.types';
import { GRID, getCardDimensions } from '../BentoGrid.constants';
import { filterCards, useCardPool } from '../core';
import { calculateInitialPositions, rectsOverlap } from '../layout';

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
];

function cardRectsOverlap(a: CardPosition, b: CardPosition): boolean {
  return rectsOverlap(a, b, GRID.GAP);
}

describe('BentoGrid filterCards', () => {
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
});

describe('BentoGrid calculateInitialPositions', () => {
  it('returns centered, non-overlapping positions', () => {
    const positions = calculateInitialPositions(cards, 4, 0);
    const values = Array.from(positions.values());

    expect(positions.size).toBe(4);
    values.forEach((position) => {
      expect(position.rotation).toBe(0);
      expect(position).toMatchObject(getCardDimensions(position.size));
    });

    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        expect(cardRectsOverlap(values[i], values[j])).toBe(false);
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
      },
    );

    expect((bounds.minX + bounds.maxX) / 2).toBeCloseTo(0);
    expect((bounds.minY + bounds.maxY) / 2).toBeCloseTo(0);
  });

  it('preserves featured project sizing', () => {
    const featuredOnly: ProjectCardData[] = [
      {
        id: 'featured',
        type: 'project',
        title: 'Featured',
        category: 'web',
        featured: true,
      },
    ];

    expect(calculateInitialPositions(featuredOnly, 1, 0).get('featured')).toMatchObject({
      size: '2x2',
      ...getCardDimensions('2x2'),
    });
  });
});

describe('useCardPool', () => {
  it('dequeues waiting cards in FIFO order', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);

    const { result } = renderHook(() =>
      useCardPool({
        cards,
        maxVisible: 1,
        rotationRange: 0,
      }),
    );

    let firstDequeued: string | undefined;
    let secondDequeued: string | undefined;

    act(() => {
      firstDequeued = result.current.dequeue()?.id;
    });
    act(() => {
      vi.setSystemTime(1200);
      secondDequeued = result.current.dequeue()?.id;
    });

    expect(firstDequeued).toBe('project-api');
    expect(secondDequeued).toBe('game-rhythm');

    vi.useRealTimers();
  });
});
