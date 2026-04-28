import type { CardData, CardPosition, ExclusionZone, Rect } from '../BentoGrid.types';
import { GRID, SEARCH_CARD } from '../BentoGrid.constants';
import { getCardDimensions, getCardSizeForIndex } from './cardSizes';
import { generateSpiralPositions, getRandomRotation, rectsOverlap } from './positions';

function withPadding(rect: Rect, padding: number): Rect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

export function calculateLayoutWithExclusion(
  cards: CardData[],
  exclusionZone: ExclusionZone,
  rotationRange: number,
): Map<string, CardPosition> {
  const positions = new Map<string, CardPosition>();
  const placed: Rect[] = [];
  const paddedExclusion = withPadding(
    exclusionZone,
    exclusionZone.padding ?? SEARCH_CARD.EXCLUSION_PADDING,
  );
  const spiralPositions = generateSpiralPositions(cards.length * 10 + 48);
  let spiralIndex = 0;

  cards.forEach((card, cardIndex) => {
    const size = getCardSizeForIndex(cardIndex, card);
    const dimensions = getCardDimensions(size);
    let placedPosition: CardPosition | null = null;

    while (spiralIndex < spiralPositions.length && !placedPosition) {
      const spiralPos = spiralPositions[spiralIndex];
      spiralIndex++;

      const x = spiralPos.col * (GRID.CELL_SIZE + GRID.GAP);
      const y = spiralPos.row * (GRID.CELL_SIZE + GRID.GAP);
      const rect = { x, y, width: dimensions.width, height: dimensions.height };

      if (rectsOverlap(rect, paddedExclusion, 0)) continue;
      if (placed.some((placedRect) => rectsOverlap(rect, placedRect))) continue;

      placedPosition = {
        x,
        y,
        rotation: getRandomRotation(rotationRange),
        size,
        width: dimensions.width,
        height: dimensions.height,
      };
      placed.push(rect);
    }

    if (!placedPosition) {
      const fallbackY = (Math.ceil(Math.sqrt(cards.length)) + cardIndex + 1) * (GRID.CELL_SIZE + GRID.GAP);
      placedPosition = {
        x: 0,
        y: fallbackY,
        rotation: getRandomRotation(rotationRange),
        size,
        width: dimensions.width,
        height: dimensions.height,
      };
    }

    positions.set(card.id, placedPosition);
  });

  return positions;
}
