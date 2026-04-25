import type { CardData, CardPosition, CardSize } from '../../UnifiedGrid.types';
import { GRID, getCardDimensions } from '../../UnifiedGrid.constants';

/**
 * Assigns card sizes based on index pattern for visual variety.
 */
function getCardSize(index: number, featured?: boolean): CardSize {
  if (featured) return '2x2';

  const pattern: CardSize[] = ['1x1', '1x1', '2x1', '1x1', '1x2', '1x1', '1x1', '1x1'];
  return pattern[index % pattern.length];
}

/**
 * Generates a random rotation within range.
 */
function getRandomRotation(range: number): number {
  if (range === 0) return 0;
  return (Math.random() - 0.5) * 2 * range;
}

/**
 * Generates grid cell positions in a spiral pattern from center.
 */
function generateSpiralPositions(count: number): Array<{ col: number; row: number }> {
  const positions: Array<{ col: number; row: number }> = [];
  let col = 0;
  let row = 0;
  let direction = 0;
  let stepsInDirection = 1;
  let stepsTaken = 0;
  let directionChanges = 0;

  for (let i = 0; i < count; i++) {
    positions.push({ col, row });

    switch (direction) {
      case 0:
        col++;
        break;
      case 1:
        row++;
        break;
      case 2:
        col--;
        break;
      case 3:
        row--;
        break;
    }
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

/**
 * Check if two rectangles overlap.
 */
function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  const padding = GRID.GAP;
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}

/**
 * Calculates initial positions in a spiral pattern from center.
 */
export function calculateInitialPositions(
  cards: CardData[],
  count: number,
  rotationRange: number
): Map<string, CardPosition> {
  const positions = new Map<string, CardPosition>();
  const placed: Array<{ x: number; y: number; width: number; height: number }> = [];

  // Leave space in center for search card.
  const searchCardSpace = {
    x: -GRID.CELL_SIZE,
    y: -GRID.CELL_SIZE / 2,
    width: GRID.CELL_SIZE * 2 + GRID.GAP,
    height: GRID.CELL_SIZE + GRID.GAP,
  };
  placed.push(searchCardSpace);

  // Spiral outward from center.
  const spiralPositions = generateSpiralPositions(count + 10);

  const tempPositions: Array<{
    id: string;
    x: number;
    y: number;
    size: CardSize;
    width: number;
    height: number;
  }> = [];
  let cardIndex = 0;
  let spiralIndex = 0;

  while (cardIndex < Math.min(count, cards.length) && spiralIndex < spiralPositions.length) {
    const card = cards[cardIndex];
    const spiralPos = spiralPositions[spiralIndex];

    const featured = card.type === 'project' && card.featured;
    const size = getCardSize(cardIndex, featured);
    const dimensions = getCardDimensions(size);

    const x = spiralPos.col * (GRID.CELL_SIZE + GRID.GAP);
    const y = spiralPos.row * (GRID.CELL_SIZE + GRID.GAP);

    const cardRect = { x, y, width: dimensions.width, height: dimensions.height };
    const hasCollision = placed.some((placedRect) => rectsOverlap(cardRect, placedRect));

    if (!hasCollision) {
      tempPositions.push({
        id: card.id,
        x,
        y,
        size,
        width: dimensions.width,
        height: dimensions.height,
      });
      placed.push(cardRect);
      cardIndex++;
    }

    spiralIndex++;
  }

  if (tempPositions.length > 0) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    tempPositions.forEach((position) => {
      minX = Math.min(minX, position.x);
      maxX = Math.max(maxX, position.x + position.width);
      minY = Math.min(minY, position.y);
      maxY = Math.max(maxY, position.y + position.height);
    });

    const centerOffsetX = (minX + maxX) / 2;
    const centerOffsetY = (minY + maxY) / 2;

    // Apply offset to center cards around origin.
    tempPositions.forEach((position) => {
      positions.set(position.id, {
        x: position.x - centerOffsetX,
        y: position.y - centerOffsetY,
        rotation: getRandomRotation(rotationRange),
        size: position.size,
        width: position.width,
        height: position.height,
      });
    });
  }

  return positions;
}
