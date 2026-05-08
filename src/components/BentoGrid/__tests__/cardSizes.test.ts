import { describe, it, expect } from 'vitest';
import { getCardSizeForIndex } from '../layout/cardSizes';
import type { CardData, PhotoCardData, ProjectCardData } from '../BentoGrid.types';

const plainCard: CardData = { id: 'c1', type: 'project', title: 'Test' };

const featuredCard: ProjectCardData = {
  id: 'feat', type: 'project', title: 'Featured', featured: true,
};

const photoCard: PhotoCardData = {
  id: 'photo', type: 'photo', title: 'Sunset', src: '/img.jpg',
  alt: 'Sunset', location: 'LA', year: '2025', aspectRatio: 1.5,
};

describe('getCardSizeForIndex', () => {
  it('returns 2x2 for non-photo cards when sizeMode is 2x2', () => {
    expect(getCardSizeForIndex(0, plainCard, '2x2')).toBe('2x2');
    expect(getCardSizeForIndex(5, featuredCard, '2x2')).toBe('2x2');
    expect(getCardSizeForIndex(3, photoCard, '2x2')).toBe('1x1');
  });

  it('detail mode returns 2x2 for featured, 2x1 for others', () => {
    expect(getCardSizeForIndex(0, featuredCard, 'detail')).toBe('2x2');
    expect(getCardSizeForIndex(0, plainCard, 'detail')).toBe('2x1');
    expect(getCardSizeForIndex(5, plainCard, 'detail')).toBe('2x1');
  });

  it('photo cards always return 1x1 in every mode', () => {
    expect(getCardSizeForIndex(0, photoCard)).toBe('1x1');
    expect(getCardSizeForIndex(2, photoCard)).toBe('1x1');
    expect(getCardSizeForIndex(7, photoCard)).toBe('1x1');
    expect(getCardSizeForIndex(0, photoCard, 'detail')).toBe('1x1');
    expect(getCardSizeForIndex(0, photoCard, '2x2')).toBe('1x1');
  });

  it('featured project returns 2x2 in mixed mode', () => {
    expect(getCardSizeForIndex(0, featuredCard)).toBe('2x2');
    expect(getCardSizeForIndex(4, featuredCard)).toBe('2x2');
  });

  it('cycles through SIZE_PATTERN correctly in mixed mode', () => {
    const expected = ['1x1', '1x1', '2x1', '1x1', '1x2', '1x1', '1x1', '1x1'];
    for (let i = 0; i < 16; i++) {
      expect(getCardSizeForIndex(i, plainCard)).toBe(expected[i % 8]);
    }
  });
});
