/**
 * useTiledBoard - the board as one repeating tile
 *
 * Every card is laid out once (layout.json, via layout/tile.ts) and the tile repeats in every
 * direction, so the board is endless without spawning, despawning or cloning
 * cards. Only the copies near the viewport render. Each rendered card has an
 * instance id, `<card id>@<copy col>,<copy row>`, so the same project can be
 * on screen twice; the data behind it is shared.
 *
 * The search card lives in one copy's slot (the anchor). Every other copy
 * shows an empty dock where its search card would be. When the search card is
 * stuck to an edge and another copy's dock comes fully into view, the search
 * card moves its anchor there and lands in it.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Camera, CardData, CardPosition } from '../BentoGrid.types';
import { GRID, GRID_STEP, SEARCH_CARD, SEARCH_CARD_ID, getCardDimensions } from '../BentoGrid.constants';
import { tileFromLayout, type Tile } from '../layout/tile';
import type { BoardLayout } from '../layout/boardLayout';
import { filterCards } from './cardPoolFilter';
import { screenToCanvas } from './useViewport';

/** Prefix of the empty docks shown where other copies' search cards would be. */
export const SEARCH_DOCK_PREFIX = `${SEARCH_CARD_ID}@`;

interface Copy {
  i: number;
  j: number;
}

interface TiledBoardOptions {
  cards: CardData[];
  layout: BoardLayout;
  camera: Camera;
  windowSize: { width: number; height: number };
}

export interface TiledBoardReturn {
  /** Card instances near the viewport, plus the search card at its anchor. */
  visible: Map<string, CardPosition>;
  /** Card data by instance id. */
  cardDataMap: Map<string, CardData>;
  applyFilter: (searchTerm: string, category: string | null) => void;
  /** Cards the current filter leaves out. They stay in place, dimmed, so the board keeps its shape. */
  dimmed: Set<string>;
  /** Which copy of the board holds the search card; changes when it docks elsewhere. */
  anchorKey: string;
  /** Move the search card back to the copy at the origin. */
  resetAnchor: () => void;
}

export function instanceId(cardId: string, copy: Copy): string {
  return `${cardId}@${copy.i},${copy.j}`;
}

function slotRect(tile: Tile, slot: Tile['slots'][number], copy: Copy) {
  const dims = getCardDimensions(slot.size);
  return {
    x: copy.i * tile.cols * GRID_STEP + slot.col * GRID_STEP - tile.origin.x,
    y: copy.j * tile.rows * GRID_STEP + slot.row * GRID_STEP - tile.origin.y,
    width: dims.width,
    height: dims.height,
  };
}

function viewBounds(camera: Camera, windowSize: { width: number; height: number }) {
  const topLeft = screenToCanvas(0, 0, camera, windowSize);
  const bottomRight = screenToCanvas(windowSize.width, windowSize.height, camera, windowSize);
  return { left: topLeft.x, top: topLeft.y, right: bottomRight.x, bottom: bottomRight.y };
}

/** The copies whose area touches the given bounds. */
function copiesIn(tile: Tile, bounds: ReturnType<typeof viewBounds>): Copy[] {
  const tileW = tile.cols * GRID_STEP;
  const tileH = tile.rows * GRID_STEP;
  const i0 = Math.floor((bounds.left + tile.origin.x) / tileW);
  const i1 = Math.floor((bounds.right + tile.origin.x) / tileW);
  const j0 = Math.floor((bounds.top + tile.origin.y) / tileH);
  const j1 = Math.floor((bounds.bottom + tile.origin.y) / tileH);
  const copies: Copy[] = [];
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) copies.push({ i, j });
  return copies;
}

export function useTiledBoard({ cards, layout, camera, windowSize }: TiledBoardOptions): TiledBoardReturn {
  const [dimmed, setDimmed] = useState<Set<string>>(() => new Set());
  const tile = useMemo(() => tileFromLayout(layout, cards), [layout, cards]);
  const [anchor, setAnchor] = useState<Copy>({ i: 0, j: 0 });
  const byId = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const searchSlot = tile.slots.find((slot) => slot.id === SEARCH_CARD_ID);

  // Docking: while the search card's slot is off screen (the card is stuck to
  // an edge), the first other copy of its dock to come fully into view takes
  // it in. Derived from the camera, so it's settled during render.
  const view = viewBounds(camera, windowSize);
  if (searchSlot) {
    const inset = SEARCH_CARD.EDGE_PADDING / camera.zoom;
    const inside = (copy: Copy) => {
      const rect = slotRect(tile, searchSlot, copy);
      return (
        rect.x >= view.left + inset &&
        rect.y >= view.top + inset &&
        rect.x + rect.width <= view.right - inset &&
        rect.y + rect.height <= view.bottom - inset
      );
    };
    if (!inside(anchor)) {
      const dock = copiesIn(tile, view).find((copy) => (copy.i !== anchor.i || copy.j !== anchor.j) && inside(copy));
      if (dock) setAnchor(dock);
    }
  }

  // Render everything within the despawn buffer of the viewport, rounded out
  // to whole cells so the set only changes when the view crosses a cell.
  const buffer = GRID.DESPAWN_BUFFER;
  const left = Math.floor((view.left - buffer) / GRID_STEP);
  const top = Math.floor((view.top - buffer) / GRID_STEP);
  const right = Math.ceil((view.right + buffer) / GRID_STEP);
  const bottom = Math.ceil((view.bottom + buffer) / GRID_STEP);

  const visible = useMemo(() => {
    const area = { left: left * GRID_STEP, top: top * GRID_STEP, right: right * GRID_STEP, bottom: bottom * GRID_STEP };
    const map = new Map<string, CardPosition>();
    for (const copy of copiesIn(tile, area)) {
      const isAnchor = copy.i === anchor.i && copy.j === anchor.j;
      for (const slot of tile.slots) {
        if (slot.id === SEARCH_CARD_ID && isAnchor) continue;
        const rect = slotRect(tile, slot, copy);
        if (rect.x > area.right || rect.x + rect.width < area.left) continue;
        if (rect.y > area.bottom || rect.y + rect.height < area.top) continue;
        map.set(instanceId(slot.id, copy), { ...rect, size: slot.size, rotation: 0 });
      }
    }
    if (searchSlot) {
      map.set(SEARCH_CARD_ID, { ...slotRect(tile, searchSlot, anchor), size: searchSlot.size, rotation: 0 });
    }
    return map;
  }, [tile, anchor, searchSlot, left, top, right, bottom]);

  const cardDataMap = useMemo(() => {
    const map = new Map<string, CardData>();
    visible.forEach((_pos, id) => {
      const card = byId.get(id.slice(0, id.lastIndexOf('@')));
      if (card) map.set(id, card);
    });
    return map;
  }, [visible, byId]);

  const applyFilter = useCallback(
    (searchTerm: string, category: string | null) => {
      const matches = new Set(filterCards(cards, searchTerm, category).map((card) => card.id));
      setDimmed(new Set(cards.filter((card) => !matches.has(card.id)).map((card) => card.id)));
    },
    [cards],
  );

  const resetAnchor = useCallback(() => setAnchor({ i: 0, j: 0 }), []);

  return { visible, cardDataMap, anchorKey: `${anchor.i},${anchor.j}`, applyFilter, dimmed, resetAnchor };
}
