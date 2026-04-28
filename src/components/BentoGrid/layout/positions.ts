import type { CardData, CardPosition, CardSize, Rect } from '../BentoGrid.types';
import { GRID, SEARCH_CARD } from '../BentoGrid.constants';
import { getCardDimensions, getCardSizeForIndex } from './cardSizes';

export function getRandomRotation(range: number): number {
  if (range === 0) return 0;
  return (Math.random() - 0.5) * 2 * range;
}

export function generateSpiralPositions(count: number): Array<{ col: number; row: number }> {
  const positions: Array<{ col: number; row: number }> = [];
  let col = 0;
  let row = 0;
  let direction = 0;
  let stepsInDirection = 1;
  let stepsTaken = 0;
  let directionChanges = 0;

  for (let i = 0; i < count; i++) {
    positions.push({ col, row });

    if (direction === 0) col++;
    else if (direction === 1) row++;
    else if (direction === 2) col--;
    else row--;

    stepsTaken++;
    if (stepsTaken >= stepsInDirection) {
      stepsTaken = 0;
      direction = (direction + 1) % 4;
      directionChanges++;

      if (directionChanges % 2 === 0) {
        stepsInDirection++;
      }
    }
  }

  return positions;
}

export function rectsOverlap(a: Rect, b: Rect, padding: number = GRID.GAP): boolean {
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}

export function createCardPosition(
  card: CardData,
  index: number,
  x: number,
  y: number,
  rotationRange: number,
  size: CardSize = getCardSizeForIndex(index, card),
): CardPosition {
  const dimensions = getCardDimensions(size);
  return {
    x,
    y,
    rotation: getRandomRotation(rotationRange),
    size,
    width: dimensions.width,
    height: dimensions.height,
  };
}

export function calculateInitialPositions(
  cards: CardData[],
  count: number,
  rotationRange: number,
): Map<string, CardPosition> {
  const positions = new Map<string, CardPosition>();
  const placed: Rect[] = [
    {
      x: -SEARCH_CARD.EXPANDED_WIDTH / 2,
      y: -SEARCH_CARD.EXPANDED_HEIGHT / 2,
      width: SEARCH_CARD.EXPANDED_WIDTH,
      height: SEARCH_CARD.EXPANDED_HEIGHT,
    },
  ];

  const requested = Math.min(count, cards.length);
  const spiralPositions = generateSpiralPositions(requested * 8 + 32);
  const tempPositions: Array<{ id: string } & CardPosition> = [];
  let cardIndex = 0;
  let spiralIndex = 0;

  while (cardIndex < requested && spiralIndex < spiralPositions.length) {
    const card = cards[cardIndex];
    const spiralPos = spiralPositions[spiralIndex];
    const size = getCardSizeForIndex(cardIndex, card);
    const dimensions = getCardDimensions(size);
    const x = spiralPos.col * (GRID.CELL_SIZE + GRID.GAP);
    const y = spiralPos.row * (GRID.CELL_SIZE + GRID.GAP);
    const cardRect = { x, y, width: dimensions.width, height: dimensions.height };

    if (!placed.some((placedRect) => rectsOverlap(cardRect, placedRect))) {
      tempPositions.push({
        id: card.id,
        x,
        y,
        rotation: getRandomRotation(rotationRange),
        size,
        width: dimensions.width,
        height: dimensions.height,
      });
      placed.push(cardRect);
      cardIndex++;
    }

    spiralIndex++;
  }

  if (tempPositions.length === 0) return positions;

  const bounds = tempPositions.reduce(
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

  const centerOffsetX = (bounds.minX + bounds.maxX) / 2;
  const centerOffsetY = (bounds.minY + bounds.maxY) / 2;

  tempPositions.forEach(({ id, ...position }) => {
    positions.set(id, {
      ...position,
      x: position.x - centerOffsetX,
      y: position.y - centerOffsetY,
    });
  });

  return positions;
}
