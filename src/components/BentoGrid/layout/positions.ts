import type { CardData, CardPosition, CardSize, CardSizeMode, Rect } from '../BentoGrid.types';
import { CARD_SIZES, GRID, SEARCH_CARD_ID, isPinnedCard } from '../BentoGrid.constants';
import { getCardDimensions, getCardSizeForIndex } from './cardSizes';
import { GridOccupancy, cellToPixel, sizeToSpan } from './gridOccupancy';

function area(size: CardSize): number {
  return CARD_SIZES[size].cols * CARD_SIZES[size].rows;
}

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
 * The search card is placed first at grid center, pinned cards beside it,
 * then content cards (largest first) pack outward around them, and filler
 * tiles plug whatever holes are left inside that block. All cards live in the same coordinate space and
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
  const placements: Array<{ id: string; col: number; row: number; size: CardSize }> = [];

  // The intro goes first, at grid centre, so the board opens on it. The
  // search card then takes the nearest slot to it, and the other pinned
  // cards (experience, about) pack around the two.
  const pinned = cards.filter(isPinnedCard);
  const intro = pinned.find((card) => card.type === 'intro');
  const rest = pinned.filter((card) => card !== intro);
  let centre = { col: 0, row: 0 };

  if (intro) {
    const size = getCardSizeForIndex(0, intro, sizeMode);
    const cell = grid.findNearest(0, 0, size)!;
    grid.place(cell.col, cell.row, size, intro.id);
    placements.push({ id: intro.id, col: cell.col, row: cell.row, size });
    // Whole cells only: a fractional anchor would place cards half a cell off-grid.
    centre = { col: cell.col + Math.floor(sizeToSpan(size).cols / 2) - 1, row: cell.row };
  }

  const searchCell = grid.findNearest(centre.col, centre.row, searchCardSize)!;
  grid.place(searchCell.col, searchCell.row, searchCardSize, SEARCH_CARD_ID);
  placements.push({ id: SEARCH_CARD_ID, col: searchCell.col, row: searchCell.row, size: searchCardSize });

  for (const card of rest) {
    const size = getCardSizeForIndex(0, card, sizeMode);
    const cell = grid.findNearest(centre.col, centre.row, size);
    if (!cell) continue;
    grid.place(cell.col, cell.row, size, card.id);
    placements.push({ id: card.id, col: cell.col, row: cell.row, size });
  }

  // Content packs around the middle of the search + pinned group.
  const anchorCells = placements.map((p) => ({ ...p, ...sizeToSpan(p.size) }));
  const anchorCol = Math.round(
    (Math.min(...anchorCells.map((a) => a.col)) + Math.max(...anchorCells.map((a) => a.col + a.cols))) / 2 - 0.5,
  );
  const anchorRow = Math.round(
    (Math.min(...anchorCells.map((a) => a.row)) + Math.max(...anchorCells.map((a) => a.row + a.rows))) / 2 - 0.5,
  );

  // The first screenful, biggest first: large compartments claim the space
  // around the centre and the small ones pack into what's left.
  const content = cards.filter((card) => !isPinnedCard(card) && !card.filler);
  const requested = content
    .slice(0, Math.min(count, content.length))
    .map((card, i) => ({ card, size: getCardSizeForIndex(i, card, sizeMode) }))
    .sort((a, b) => area(b.size) - area(a.size));

  for (const { card, size } of requested) {
    const cell = grid.findNearest(anchorCol, anchorRow, size);
    if (!cell) continue;

    grid.place(cell.col, cell.row, size, card.id);
    placements.push({ id: card.id, col: cell.col, row: cell.row, size });
  }

  // Plug holes inside the opening block with filler tiles, nearest the centre
  // first, so it reads as one packed tray rather than scattered cards.
  const fillers = cards.filter((card) => card.filler && !isPinnedCard(card));
  if (fillers.length > 0) {
    const spans = placements.map((p) => ({ ...p, ...sizeToSpan(p.size) }));
    const minCol = Math.min(...spans.map((p) => p.col));
    const maxCol = Math.max(...spans.map((p) => p.col + p.cols));
    const minRow = Math.min(...spans.map((p) => p.row));
    const maxRow = Math.max(...spans.map((p) => p.row + p.rows));
    const holes: Array<{ col: number; row: number }> = [];
    for (let row = minRow; row < maxRow; row++) {
      for (let col = minCol; col < maxCol; col++) {
        if (grid.canPlace(col, row, '1x1')) holes.push({ col, row });
      }
    }
    holes.sort((a, b) => (a.col - anchorCol) ** 2 + (a.row - anchorRow) ** 2 - ((b.col - anchorCol) ** 2 + (b.row - anchorRow) ** 2));
    holes.slice(0, fillers.length).forEach((hole, i) => {
      grid.place(hole.col, hole.row, '1x1', fillers[i].id);
      placements.push({ id: fillers[i].id, col: hole.col, row: hole.row, size: '1x1' });
    });
  }

  // Shift everything so the intro (or, without one, the search card) is
  // centred on the origin; the camera starts at (0,0), so the visitor opens
  // on who this is, with the search card and the rest of the pinned group
  // around it.
  let originOffset = { x: 0, y: 0 };

  if (placements.length > 0) {
    const anchors = placements.filter((p) => p.id === (intro?.id ?? SEARCH_CARD_ID)).map((p) => {
      const pixel = cellToPixel(p.col, p.row);
      const dims = getCardDimensions(p.size);
      return { left: pixel.x, top: pixel.y, right: pixel.x + dims.width, bottom: pixel.y + dims.height };
    });
    const left = Math.min(...anchors.map((a) => a.left));
    const top = Math.min(...anchors.map((a) => a.top));
    const right = Math.max(...anchors.map((a) => a.right));
    const bottom = Math.max(...anchors.map((a) => a.bottom));
    originOffset = { x: Math.round((left + right) / 2), y: Math.round((top + bottom) / 2) };

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
