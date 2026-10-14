/**
 * The board's layout, as saved by /studio in src/content/layout.json: the
 * tile's size in cells, and where each card sits in it, how big it is and how
 * its image is framed. Cards not listed are off the board.
 *
 * The tile repeats in every direction, so it wraps: a card's top-left cell is
 * inside the tile, but the card can hang over the right or bottom edge into
 * the next copy, filling the matching gap on the opposite side. That way no
 * straight seam has to run through the board. Each row of copies can also be
 * shifted sideways (`shift`), like brickwork, so the seams don't line up.
 *
 * Pure functions only, so the board, the studio and the server can share them.
 */

import type { CardSize } from '../BentoGrid.types';

/** How a project card shows itself. */
export type CardVariant = 'full' | 'image' | 'text';

export interface CardLook {
  /** Image to show instead of the project's featured image. */
  image?: string;
  /** Focal point in percent of the image, [x, y]; what stays in view when it's cropped. */
  focus?: [number, number];
  /** Extra zoom on the image, from 1. */
  zoom?: number;
  variant?: CardVariant;
  /** Show the one-line description. Defaults to on for cards two rows tall or more. */
  description?: boolean;
}

export interface LayoutCard {
  id: string;
  col: number;
  row: number;
  w: number;
  h: number;
  look?: CardLook;
}

export interface BoardLayout {
  cols: number;
  rows: number;
  /** Columns each row of copies is shifted right by, relative to the row above. */
  shift?: number;
  cards: LayoutCard[];
}

type TileShape = Pick<BoardLayout, 'cols' | 'rows' | 'shift'>;
type Rect = Pick<LayoutCard, 'col' | 'row' | 'w' | 'h'>;

function mod(value: number, by: number) {
  return ((value % by) + by) % by;
}

/** The copy of the tile a cell falls in, and where it lands inside the tile. */
export function wrapCell(tile: TileShape, col: number, row: number) {
  const j = Math.floor(row / tile.rows);
  const shifted = col - j * (tile.shift ?? 0);
  const i = Math.floor(shifted / tile.cols);
  return { col: shifted - i * tile.cols, row: row - j * tile.rows, copy: { i, j } };
}

/** Where copy (i, j) of the tile starts, in cells from copy (0, 0). */
export function copyOffset(tile: TileShape, copy: { i: number; j: number }) {
  return { col: copy.i * tile.cols + copy.j * (tile.shift ?? 0), row: copy.j * tile.rows };
}

/** A rect with its top-left cell wrapped back inside the tile; the same spot on the board. */
export function wrapRect<T extends Rect>(tile: TileShape, rect: T): T {
  const { col, row } = wrapCell(tile, rect.col, rect.row);
  return { ...rect, col, row };
}

/** The tile cells a rect covers, wrapped, as "col,row" keys. */
function cellsOf(tile: TileShape, rect: Rect): string[] {
  const out: string[] = [];
  for (let c = rect.col; c < rect.col + rect.w; c++) {
    for (let r = rect.row; r < rect.row + rect.h; r++) {
      const cell = wrapCell(tile, c, r);
      out.push(`${cell.col},${cell.row}`);
    }
  }
  return out;
}

/** The search card's id in layout.json. */
export const LAYOUT_SEARCH_ID = 'search';

export const MAX_SPAN = { w: 4, h: 3 } as const;

export function sizeOf(card: Pick<LayoutCard, 'w' | 'h'>): CardSize {
  return `${card.w}x${card.h}`;
}

/** Whether two cards share a cell anywhere on the board, counting the wrap. */
export function overlaps(tile: TileShape, a: Rect, b: Rect) {
  const cells = new Set(cellsOf(tile, a));
  return cellsOf(tile, b).some((cell) => cells.has(cell));
}

/** Whether a rect's top-left is inside the tile and it doesn't wrap onto itself. */
export function fits(tile: TileShape, rect: Rect) {
  if (rect.col < 0 || rect.row < 0 || rect.col >= tile.cols || rect.row >= tile.rows) return false;
  return new Set(cellsOf(tile, rect)).size === rect.w * rect.h;
}

/** The free spot for a w x h card nearest (col, row), or null if the tile has none. */
export function nearestFreeSpot(
  layout: BoardLayout,
  w: number,
  h: number,
  near: { col: number; row: number },
  ignore?: string,
): { col: number; row: number } | null {
  const others = layout.cards.filter((card) => card.id !== ignore);
  let best: { col: number; row: number } | null = null;
  let bestDistance = Infinity;
  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.cols; col++) {
      const rect = { col, row, w, h };
      if (!fits(layout, rect) || others.some((card) => overlaps(layout, card, rect))) continue;
      const distance = Math.hypot(col - near.col, row - near.row);
      if (distance < bestDistance) {
        best = { col, row };
        bestDistance = distance;
      }
    }
  }
  return best;
}

/**
 * Put a card at a rect. Cards it lands on move to the nearest free spot,
 * or off the board if there is none. Returns the new layout and the ids
 * that fell off.
 */
export function placeCard(layout: BoardLayout, id: string, rect: Omit<LayoutCard, 'id' | 'look'>) {
  const existing = layout.cards.find((card) => card.id === id);
  const moved: LayoutCard = wrapRect(layout, { ...existing, id, ...rect });
  const displaced = layout.cards.filter((card) => card.id !== id && overlaps(layout, card, moved));
  let next: BoardLayout = {
    ...layout,
    cards: [...layout.cards.filter((card) => card.id !== id && !displaced.includes(card)), moved],
  };
  const removed: string[] = [];
  // Largest first, so big cards get the best of the remaining space. Each
  // tries the moved card's old spot first, so dropping onto a card swaps them.
  for (const card of [...displaced].sort((a, b) => b.w * b.h - a.w * a.h)) {
    const swap = existing && { col: existing.col, row: existing.row, w: card.w, h: card.h };
    const swapFree = swap && fits(layout, swap) && !next.cards.some((other) => overlaps(layout, other, swap));
    const spot = swapFree ? { col: swap.col, row: swap.row } : nearestFreeSpot(next, card.w, card.h, card);
    if (spot) next = { ...next, cards: [...next.cards, { ...card, ...spot }] };
    else removed.push(card.id);
  }
  return { layout: next, removed };
}

/** Cells no card covers, counting the wrap, as [col, row] pairs. */
export function holes(layout: BoardLayout): [number, number][] {
  const covered = new Set(layout.cards.flatMap((card) => cellsOf(layout, card)));
  const out: [number, number][] = [];
  for (let r = 0; r < layout.rows; r++) for (let c = 0; c < layout.cols; c++) if (!covered.has(`${c},${r}`)) out.push([c, r]);
  return out;
}

/** The smallest tile that still holds every card's top-left, and its widest and tallest card. */
export function minTileSize(layout: BoardLayout) {
  return {
    cols: Math.max(1, ...layout.cards.map((card) => Math.max(card.col + 1, card.w))),
    rows: Math.max(1, ...layout.cards.map((card) => Math.max(card.row + 1, card.h))),
  };
}

/** The first pair of cards that share a cell, counting the wrap, if any. */
export function firstClash(layout: BoardLayout): [LayoutCard, LayoutCard] | null {
  const owner = new Map<string, LayoutCard>();
  for (const card of layout.cards) {
    for (const cell of cellsOf(layout, card)) {
      const other = owner.get(cell);
      if (other && other !== card) return [other, card];
      owner.set(cell, card);
    }
  }
  return null;
}

/** Cards in reading order: top to bottom, then left to right. */
export function readingOrder<T extends Pick<LayoutCard, 'col' | 'row'>>(cards: T[]): T[] {
  return [...cards].sort((a, b) => a.row - b.row || a.col - b.col);
}
