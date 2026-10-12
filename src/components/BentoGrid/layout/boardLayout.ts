/**
 * The board's layout, as saved by /studio in src/content/layout.json: the
 * tile's size in cells, and where each card sits in it, how big it is and how
 * its image is framed. Cards not listed are off the board.
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
  cards: LayoutCard[];
}

/** The search card's id in layout.json. */
export const LAYOUT_SEARCH_ID = 'search';

export const MAX_SPAN = { w: 4, h: 3 } as const;

export function sizeOf(card: Pick<LayoutCard, 'w' | 'h'>): CardSize {
  return `${card.w}x${card.h}`;
}

export function overlaps(a: Pick<LayoutCard, 'col' | 'row' | 'w' | 'h'>, b: Pick<LayoutCard, 'col' | 'row' | 'w' | 'h'>) {
  return a.col < b.col + b.w && b.col < a.col + a.w && a.row < b.row + b.h && b.row < a.row + a.h;
}

export function fits(layout: Pick<BoardLayout, 'cols' | 'rows'>, rect: Pick<LayoutCard, 'col' | 'row' | 'w' | 'h'>) {
  return rect.col >= 0 && rect.row >= 0 && rect.col + rect.w <= layout.cols && rect.row + rect.h <= layout.rows;
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
  for (let row = 0; row + h <= layout.rows; row++) {
    for (let col = 0; col + w <= layout.cols; col++) {
      const rect = { col, row, w, h };
      if (others.some((card) => overlaps(card, rect))) continue;
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
  const moved: LayoutCard = { ...existing, id, ...rect };
  const displaced = layout.cards.filter((card) => card.id !== id && overlaps(card, moved));
  let next: BoardLayout = {
    ...layout,
    cards: [...layout.cards.filter((card) => card.id !== id && !displaced.includes(card)), moved],
  };
  const removed: string[] = [];
  // Largest first, so big cards get the best of the remaining space.
  for (const card of [...displaced].sort((a, b) => b.w * b.h - a.w * a.h)) {
    const spot = nearestFreeSpot(next, card.w, card.h, card);
    if (spot) next = { ...next, cards: [...next.cards, { ...card, ...spot }] };
    else removed.push(card.id);
  }
  return { layout: next, removed };
}

/** Cells no card covers, as [col, row] pairs. */
export function holes(layout: BoardLayout): [number, number][] {
  const covered = new Set<string>();
  for (const card of layout.cards) {
    for (let c = card.col; c < card.col + card.w; c++) {
      for (let r = card.row; r < card.row + card.h; r++) covered.add(`${c},${r}`);
    }
  }
  const out: [number, number][] = [];
  for (let r = 0; r < layout.rows; r++) for (let c = 0; c < layout.cols; c++) if (!covered.has(`${c},${r}`)) out.push([c, r]);
  return out;
}

/** The smallest tile that still holds every card. */
export function minTileSize(layout: BoardLayout) {
  return {
    cols: Math.max(1, ...layout.cards.map((card) => card.col + card.w)),
    rows: Math.max(1, ...layout.cards.map((card) => card.row + card.h)),
  };
}

/** Cards in reading order: top to bottom, then left to right. */
export function readingOrder<T extends Pick<LayoutCard, 'col' | 'row'>>(cards: T[]): T[] {
  return [...cards].sort((a, b) => a.row - b.row || a.col - b.col);
}
