/**
 * The board's tile: every card laid out once, edge to edge, in a block that
 * repeats in all directions. Panning never runs out of cards and never shows a
 * hole, and panning back always finds the same card in the same place, because
 * every copy of the block is identical.
 *
 * The block is built from bands two rows tall. Each band is a run of columns:
 * a 2x2 or 3x2 card, or the search card over a 2x1 card. Every band is padded
 * to the same width by widening 2x2 projects, so the block is a gapless
 * rectangle and its copies meet without seams.
 */

import type { CardData, CardSize } from '../BentoGrid.types';
import { GRID, GRID_STEP, SEARCH_CARD_ID } from '../BentoGrid.constants';

export interface TileSlot {
  id: string;
  col: number;
  row: number;
  size: CardSize;
}

export interface Tile {
  cols: number;
  rows: number;
  slots: TileSlot[];
  /** Pixel point in the tile that sits at the canvas origin: the intro's centre. */
  origin: { x: number; y: number };
}

/** A band column: its width in cells and the cards in it, offset from its top-left cell. */
interface Column {
  width: number;
  cards: { id: string; size: CardSize; dc: number; dr: number }[];
}

const BAND_ROWS = 2;
/** Width over height of the block, in cells. Wider than tall, like a screen. */
const TILE_ASPECT = 1.6;

export function buildTile(cards: CardData[]): Tile {
  const intro = cards.find((card) => card.type === 'intro');
  const pinned = cards.filter((card) => card.pinned && card !== intro);
  // A 2x1 pinned card (about) sits under the search card; that column is 2 wide.
  const area = cards.reduce((sum, card) => sum + (card.size === '2x1' ? 0 : widthOfCard(card)), 0) + 2;
  const ideal = Math.sqrt(area * BAND_ROWS * TILE_ASPECT);

  // Try widths around the ideal and keep the one that leaves the fewest holes,
  // then the one closest to the ideal shape.
  let best: { bands: Column[][]; width: number; holes: number } | null = null;
  for (let width = Math.floor(ideal) - 3; width <= Math.max(Math.ceil(ideal) + 3, area); width++) {
    const attempt = layBands(cards, intro, pinned, width);
    if (!attempt) continue;
    const score = (a: typeof best) => a!.holes * 100 + Math.abs(a!.width - ideal);
    if (!best || score(attempt) < score(best)) best = attempt;
  }
  if (!best) throw new Error('buildTile: no width fits the home band');

  const slots: TileSlot[] = [];
  best.bands.forEach((band, bandIndex) => {
    let col = 0;
    for (const column of band) {
      for (const card of column.cards) {
        slots.push({ id: card.id, col: col + card.dc, row: bandIndex * BAND_ROWS + card.dr, size: card.size });
      }
      col += column.width;
    }
  });

  const rows = best.bands.length * BAND_ROWS;
  return {
    cols: best.width,
    rows,
    slots,
    origin: originFor(slots.find((slot) => slot.id === intro?.id), best.width, rows),
  };
}

function layBands(cards: CardData[], intro: CardData | undefined, pinned: CardData[], width: number) {
  // The opening group shares the home band: the intro, then the search card
  // with the 2x1 pinned card under it, then any other pinned cards.
  const under = pinned.find((card) => card.size === '2x1');
  const home: Column[] = [];
  if (intro) home.push(single(intro));
  home.push(searchColumn(under));
  pinned.filter((card) => card !== under).forEach((card) => home.push(single(card)));

  const widthOf = (band: Column[]) => band.reduce((sum, col) => sum + col.width, 0);
  if (width < widthOf(home)) return null;
  const rest = cards.filter((card) => card !== intro && !pinned.includes(card)).map(single);
  const bandCount = Math.max(1, Math.round((widthOf(home) + widthOf(rest)) / width));

  // Fill bands nearest the home band first, so cards listed first (featured
  // work) end up closest to the intro.
  const middle = Math.floor(bandCount / 2);
  const bands: Column[][] = Array.from({ length: bandCount }, () => []);
  bands[middle].push(...home);
  const nearestFirst = [...bands.keys()].sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle) || a - b);

  for (const col of rest) {
    const target = nearestFirst.find((index) => widthOf(bands[index]) + col.width <= width);
    if (target === undefined) {
      bands.push([col]);
      nearestFirst.push(bands.length - 1);
    } else {
      bands[target].push(col);
    }
  }

  // Pad every band to full width by widening 2x2 projects to 3x2, spread
  // evenly through the band so the wide cards don't bunch up.
  let holes = 0;
  for (const band of bands) {
    const gap = width - widthOf(band);
    const widenable = band.filter((col) => col.cards.length === 1 && col.cards[0].size === '2x2' && !isPinned(col.cards[0].id));
    const count = Math.min(gap, widenable.length);
    for (let k = 0; k < count; k++) {
      const col = widenable[Math.floor(((k + 0.5) * widenable.length) / count)];
      col.width = 3;
      col.cards = [{ ...col.cards[0], size: '3x2' }];
    }
    holes += gap - count;
  }

  function isPinned(id: string) {
    return id === intro?.id || pinned.some((card) => card.id === id);
  }

  return { bands, width, holes };
}

function widthOfCard(card: CardData) {
  return SPAN[card.size ?? '2x2'] ?? 2;
}

const SPAN: Partial<Record<CardSize, number>> = { '2x2': 2, '3x2': 3 };

function single(card: CardData): Column {
  const size = card.size ?? '2x2';
  return { width: SPAN[size] ?? 2, cards: [{ id: card.id, size, dc: 0, dr: 0 }] };
}

/** The search card on top, with a 2x1 card under it. */
function searchColumn(under?: CardData): Column {
  const cards: Column['cards'] = [{ id: SEARCH_CARD_ID, size: '2x1', dc: 0, dr: 0 }];
  if (under) cards.push({ id: under.id, size: '2x1', dc: 0, dr: 1 });
  return { width: 2, cards };
}

function originFor(intro: TileSlot | undefined, cols: number, rows: number) {
  if (!intro) return { x: (cols * GRID_STEP) / 2, y: (rows * GRID_STEP) / 2 };
  const span = SPAN[intro.size] ?? 2;
  return {
    x: intro.col * GRID_STEP + (span * GRID_STEP - GRID.GAP) / 2,
    y: intro.row * GRID_STEP + (BAND_ROWS * GRID_STEP - GRID.GAP) / 2,
  };
}
