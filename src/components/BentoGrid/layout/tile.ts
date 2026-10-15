/**
 * The board's tile: every card laid out once, in a block that repeats in all
 * directions. Panning never runs out of cards, and panning back always finds
 * the same card in the same place, because every copy of the block is
 * identical.
 *
 * The block is hand-laid in /studio and saved as src/content/layout.json;
 * this turns that layout into slots for the cards the board was given.
 */

import type { CardData, CardSize } from '../BentoGrid.types';
import { GRID, GRID_STEP, SEARCH_CARD_ID } from '../BentoGrid.constants';
import { LAYOUT_SEARCH_ID, sizeOf, type BoardLayout } from './boardLayout';

export interface TileSlot {
  id: string;
  col: number;
  row: number;
  size: CardSize;
}

export interface Tile {
  cols: number;
  rows: number;
  /** Columns each row of copies is shifted right by. */
  shift: number;
  slots: TileSlot[];
  /** Pixel point in the tile that sits at the canvas origin: the home group's centre. */
  origin: { x: number; y: number };
}

const HOME_IDS = ['intro', LAYOUT_SEARCH_ID, 'contact'];

export function tileFromLayout(layout: BoardLayout, cards: CardData[]): Tile {
  const known = new Set(cards.map((card) => card.id));
  const slots: TileSlot[] = [];
  for (const card of layout.cards) {
    const id = card.id === LAYOUT_SEARCH_ID ? SEARCH_CARD_ID : card.id;
    if (id !== SEARCH_CARD_ID && !known.has(id)) continue;
    slots.push({ id, col: card.col, row: card.row, size: sizeOf(card) });
  }

  // The camera opens on the home group (intro, search and contact) as a whole.
  const home = layout.cards.filter((card) => HOME_IDS.includes(card.id));
  const origin = home.length
    ? {
        x: (Math.min(...home.map((c) => c.col)) * GRID_STEP + Math.max(...home.map((c) => c.col + c.w)) * GRID_STEP - GRID.GAP) / 2,
        y: (Math.min(...home.map((c) => c.row)) * GRID_STEP + Math.max(...home.map((c) => c.row + c.h)) * GRID_STEP - GRID.GAP) / 2,
      }
    : { x: (layout.cols * GRID_STEP) / 2, y: (layout.rows * GRID_STEP) / 2 };

  return { cols: layout.cols, rows: layout.rows, shift: layout.shift ?? 0, slots, origin };
}
