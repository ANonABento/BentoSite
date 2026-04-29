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
      const rowStep = GRID.CELL_SIZE + GRID.GAP;
      const fallbackY = paddedExclusion.y + paddedExclusion.height + rowStep;
      let row = 0;

      while (!placedPosition) {
        const rect = {
          x: 0,
          y: fallbackY + row * rowStep,
          width: dimensions.width,
          height: dimensions.height,
        };

        if (
          !rectsOverlap(rect, paddedExclusion, 0) &&
          !placed.some((placedRect) => rectsOverlap(rect, placedRect))
        ) {
          placedPosition = {
            ...rect,
            rotation: getRandomRotation(rotationRange),
            size,
          };
          placed.push(rect);
        }

        row++;
      }
    }

    positions.set(card.id, placedPosition);
  });

  return positions;
}
