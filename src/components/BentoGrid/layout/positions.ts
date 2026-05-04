import type { CardData, CardPosition, CardSize, Rect } from '../BentoGrid.types';
import { GRID, SEARCH_CARD_ID } from '../BentoGrid.constants';
import { getCardDimensions, getCardSizeForIndex } from './cardSizes';
import { GridOccupancy, cellToPixel, sizeToSpan } from './gridOccupancy';

export function getRandomRotation(range: number): number {
  if (range === 0) return 0;
  return (Math.random() - 0.5) * 2 * range;
}

/** @deprecated Use GridOccupancy.findNearest instead. Kept for test compat. */
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

/** Search card size in the grid. */
const SEARCH_CARD_SIZE: CardSize = '2x1';

/**
 * Calculate initial card positions using grid-snapped placement.
 *
 * The search card is placed first at grid center as a regular 2×1 card.
 * Content cards spiral outward around it. All cards live in the same
 * coordinate space and are positioned the same way.
 *
 * Returns a Map of cardId → CardPosition including the search card.
 */
export function calculateInitialPositions(
  cards: CardData[],
  count: number,
  _rotationRange: number,
): Map<string, CardPosition> {
  const positions = new Map<string, CardPosition>();
  const grid = new GridOccupancy();

  // Place the search card first at grid center
  const searchCell = grid.findNearest(0, 0, SEARCH_CARD_SIZE)!;
  grid.place(searchCell.col, searchCell.row, SEARCH_CARD_SIZE, SEARCH_CARD_ID);

  // Place content cards spiraling outward
  const requested = Math.min(count, cards.length);
  const placements: Array<{ id: string; col: number; row: number; size: CardSize }> = [
    { id: SEARCH_CARD_ID, col: searchCell.col, row: searchCell.row, size: SEARCH_CARD_SIZE },
  ];

  for (let i = 0; i < requested; i++) {
    const card = cards[i];
    const size = getCardSizeForIndex(i, card);

    const cell = grid.findNearest(0, 0, size);
    if (!cell) continue;

    grid.place(cell.col, cell.row, size, card.id);
    placements.push({ id: card.id, col: cell.col, row: cell.row, size });
  }

  // Center all cards (including search) around origin
  if (placements.length > 0) {
    const bounds = placements.reduce(
      (acc, p) => {
        const span = sizeToSpan(p.size);
        return {
          minCol: Math.min(acc.minCol, p.col),
          maxCol: Math.max(acc.maxCol, p.col + span.cols),
          minRow: Math.min(acc.minRow, p.row),
          maxRow: Math.max(acc.maxRow, p.row + span.rows),
        };
      },
      { minCol: Infinity, maxCol: -Infinity, minRow: Infinity, maxRow: -Infinity },
    );

    const offsetCol = Math.round((bounds.minCol + bounds.maxCol) / 2);
    const offsetRow = Math.round((bounds.minRow + bounds.maxRow) / 2);

    for (const p of placements) {
      const dimensions = getCardDimensions(p.size);
      const pixel = cellToPixel(p.col - offsetCol, p.row - offsetRow);
      positions.set(p.id, {
        x: pixel.x,
        y: pixel.y,
        width: dimensions.width,
        height: dimensions.height,
        size: p.size,
        rotation: 0,
      });
    }
  }

  return positions;
}

/**
 * Create a GridOccupancy map from an existing set of card positions.
 * Used to reconstruct the grid state from visible cards.
 */
export function occupancyFromPositions(
  positions: Map<string, CardPosition>,
): GridOccupancy {
  const grid = new GridOccupancy();

  positions.forEach((pos, cardId) => {
    const { col, row } = { col: Math.round(pos.x / (GRID.CELL_SIZE + GRID.GAP)), row: Math.round(pos.y / (GRID.CELL_SIZE + GRID.GAP)) };
    if (grid.canPlace(col, row, pos.size)) {
      grid.place(col, row, pos.size, cardId);
    }
  });

  return grid;
}
