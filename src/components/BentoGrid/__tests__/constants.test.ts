import { describe, expect, it } from 'vitest';
import {
  CARD_POOL,
  GRID,
  QUEUE,
  SEARCH_CARD,
  STICKY,
  getCardDimensions,
} from '../BentoGrid.constants';

describe('BentoGrid constants', () => {
  it('uses FIFO naming for the card pool bridge', () => {
    expect(CARD_POOL.policy).toBe('FIFO');
    expect(CARD_POOL.POLICY).toBe('FIFO');
    expect(QUEUE.policy).toBe('FIFO');
  });

  it('applies the updated info card compressed dimensions', () => {
    expect(SEARCH_CARD.SQUASHED_SIDE_WIDTH).toBe(64);
    expect(SEARCH_CARD.squashedSideWidth).toBe(64);
    expect(SEARCH_CARD.COLLAPSED_HEIGHT).toBe(64);
    expect(SEARCH_CARD.collapsedHeight).toBe(64);
  });

  it('keeps source-compatible aliases mapped to the BentoGrid values', () => {
    expect(GRID.CELL_SIZE).toBe(GRID.cellSize);
    expect(GRID.GAP).toBe(GRID.gap);
    expect(SEARCH_CARD.cardWidth).toBe(getCardDimensions('2x1').width);
    expect(SEARCH_CARD.cardHeight).toBe(getCardDimensions('2x1').height);
    expect(STICKY.threshold).toBe(SEARCH_CARD.STICKY_THRESHOLD);
  });
});
