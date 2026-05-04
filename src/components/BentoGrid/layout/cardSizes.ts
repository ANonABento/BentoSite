import type { CardData, CardSize, CardSizeMode } from '../BentoGrid.types';
import { CARD_SIZES, getCardDimensions } from '../BentoGrid.constants';

const SIZE_PATTERN: CardSize[] = ['1x1', '1x1', '2x1', '1x1', '1x2', '1x1', '1x1', '1x1'];

export function getCardSizeForIndex(index: number, card?: CardData, sizeMode: CardSizeMode = 'mixed'): CardSize {
  if (sizeMode === '2x2') return '2x2';
  if (card?.type === 'project' && card.featured) return '2x2';
  return SIZE_PATTERN[index % SIZE_PATTERN.length];
}

export { CARD_SIZES, getCardDimensions };
