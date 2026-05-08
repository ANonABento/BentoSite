import type { CardData, CardPosition, CardSize, CardSizeMode, Rect } from '../BentoGrid.types';
import { GRID, SEARCH_CARD_ID } from '../BentoGrid.constants';
import { getCardDimensions, getCardSizeForIndex } from './cardSizes';
import { GridOccupancy, cellToPixel } from './gridOccupancy';

export function getRandomRotation(range: number): number {
  if (range === 0) return 0;
  return (Math.random() - 0.5) * 2 * range;
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

/**
 * Calculate initial card positions using grid-snapped placement.
 *
 * The search card is placed first at grid center. Content cards spiral
 * outward around it. All cards live in the same coordinate space and
 * are positioned the same way.
 *
 * Returns a Map of cardId → CardPosition including the search card.
 */
export interface InitialPositionsResult {
  positions: Map<string, CardPosition>;
  grid: GridOccupancy;
  /** Pixel offset applied to center the search card at origin.
   *  Add this back to pixel coords before calling pixelToCell. */
  originOffset: { x: number; y: number };
}

export function calculateInitialPositions(
  cards: CardData[],
  count: number,
  _rotationRange: number,
  sizeMode: CardSizeMode = 'mixed',
): InitialPositionsResult {
  const positions = new Map<string, CardPosition>();
  const grid = new GridOccupancy();

  // Search card is always 2×1 — wide enough for search UI, compact vertically
  const searchCardSize: CardSize = '2x1';

  // Place the search card first at grid center
  const searchCell = grid.findNearest(0, 0, searchCardSize)!;
  grid.place(searchCell.col, searchCell.row, searchCardSize, SEARCH_CARD_ID);

  // Place content cards spiraling outward
  const requested = Math.min(count, cards.length);
  const placements: Array<{ id: string; col: number; row: number; size: CardSize }> = [
    { id: SEARCH_CARD_ID, col: searchCell.col, row: searchCell.row, size: searchCardSize },
  ];

  for (let i = 0; i < requested; i++) {
    const card = cards[i];
    const size = getCardSizeForIndex(i, card, sizeMode);

    const cell = grid.findNearest(0, 0, size);
    if (!cell) continue;

    grid.place(cell.col, cell.row, size, card.id);
    placements.push({ id: card.id, col: cell.col, row: cell.row, size });
  }

  // Center all cards so the search card's center is at the origin (0,0).
  // The camera starts at (0,0), so the search card appears screen-centered.
  let originOffset = { x: 0, y: 0 };

  if (placements.length > 0) {
    const searchPlacement = placements[0]; // search card is always first
    const searchDims = getCardDimensions(searchPlacement.size);
    const searchPixel = cellToPixel(searchPlacement.col, searchPlacement.row);
    originOffset = {
      x: searchPixel.x + searchDims.width / 2,
      y: searchPixel.y + searchDims.height / 2,
    };

    for (const p of placements) {
      const dimensions = getCardDimensions(p.size);
      const pixel = cellToPixel(p.col, p.row);
      positions.set(p.id, {
        x: pixel.x - originOffset.x,
        y: pixel.y - originOffset.y,
        width: dimensions.width,
        height: dimensions.height,
        size: p.size,
        rotation: 0,
      });
    }
  }

  return { positions, grid, originOffset };
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
