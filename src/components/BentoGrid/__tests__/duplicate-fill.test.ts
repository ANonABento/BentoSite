import { describe, expect, it } from 'vitest';
import {
  CLONE_SUFFIX,
  DEFAULT_FILL_TARGET,
  duplicateCardsForFill,
  isClone,
  stripCloneSuffix,
} from '../duplicate-fill';
import type { CardData } from '../BentoGrid.types';

function makeCard(id: string): CardData {
  return { id, type: 'project', title: id, description: '', category: '' } as CardData;
}

describe('duplicateCardsForFill', () => {
  it('returns the input unchanged when the pool is already at or above target', () => {
    const cards = Array.from({ length: 60 }, (_, i) => makeCard(`p${i}`));
    expect(duplicateCardsForFill(cards, 48)).toBe(cards);
  });

  it('returns an empty array when given an empty pool', () => {
    expect(duplicateCardsForFill([])).toEqual([]);
  });

  it('cycles the pool to reach the target count', () => {
    const source = ['a', 'b', 'c', 'd'].map(makeCard);
    const result = duplicateCardsForFill(source, 10);

    expect(result).toHaveLength(10);
    // First cycle keeps original IDs
    expect(result.slice(0, 4).map((card) => card.id)).toEqual(['a', 'b', 'c', 'd']);
    // Second cycle adds suffix -clone-1
    expect(result.slice(4, 8).map((card) => card.id)).toEqual([
      'a-clone-1',
      'b-clone-1',
      'c-clone-1',
      'd-clone-1',
    ]);
    // Third cycle adds suffix -clone-2 (only first two before hitting target)
    expect(result.slice(8).map((card) => card.id)).toEqual(['a-clone-2', 'b-clone-2']);
  });

  it('uses DEFAULT_FILL_TARGET when no target is specified', () => {
    const source = ['a', 'b', 'c'].map(makeCard);
    const result = duplicateCardsForFill(source);
    expect(result).toHaveLength(DEFAULT_FILL_TARGET);
  });

  it('preserves all card fields besides id when cloning', () => {
    const card: CardData = {
      id: 'robot-arm',
      type: 'project',
      title: 'Robot Arm',
      description: 'A robotic arm',
      category: 'Robotics',
    } as CardData;

    const result = duplicateCardsForFill([card], 3);
    expect(result).toHaveLength(3);
    for (const clone of result) {
      expect(clone.title).toBe('Robot Arm');
      expect(clone.description).toBe('A robotic arm');
      expect(clone.category).toBe('Robotics');
    }
  });
});

describe('stripCloneSuffix', () => {
  it('returns the original id when no suffix is present', () => {
    expect(stripCloneSuffix('robotic-arm-puppeteer')).toBe('robotic-arm-puppeteer');
  });

  it('strips a -clone-N suffix', () => {
    expect(stripCloneSuffix(`robotic-arm-puppeteer${CLONE_SUFFIX}1`)).toBe('robotic-arm-puppeteer');
    expect(stripCloneSuffix(`p${CLONE_SUFFIX}42`)).toBe('p');
  });
});

describe('isClone', () => {
  it('returns true for ids with the clone suffix', () => {
    expect(isClone('foo-clone-1')).toBe(true);
  });

  it('returns false for plain ids', () => {
    expect(isClone('foo')).toBe(false);
    expect(isClone('foo-bar')).toBe(false);
  });
});
