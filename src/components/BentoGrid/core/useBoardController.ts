/**
 * useBoardController - Grid Layout, Spawn/Despawn & Search Card Rehoming
 *
 * Manages the board's visible card set and spawn queue.
 *
 * Cards that scroll away are parked, not forgotten: each keeps its grid
 * slot, so panning back shows the same cards in the same places. New cards
 * only go into unexplored slots near the viewport; when every card has a
 * place, the places furthest from the visitor are recycled first.
 *
 * The search card is special: it never despawns and can be rehomed to a
 * new grid cell via rehomeSearchCard. Content cards in the way slide to
 * the nearest free slot rather than being removed.
 */
'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  Camera,
  CardData,
  CardPosition,
  CardSizeMode,
  QueuedCard,
  SpawnPhysicsBridge,
  ViewportBounds,
  CardSize,
  Velocity,
} from '../BentoGrid.types';
import { GRID, QUEUE, SEARCH_CARD_ID, isPinnedCard } from '../BentoGrid.constants';
import { stripCloneSuffix } from '../duplicate-fill';
import {
  calculateInitialPositions,
  getCardDimensions,
  getCardSizeForIndex,
  getRandomRotation,
  GridOccupancy,
  cellToPixel,
  pixelToCell,
  sizeToSpan,
} from '../layout';
import { filterCards } from './cardPoolFilter';
import { screenToCanvas } from './useViewport';

interface BoardControllerOptions {
  cards: CardData[];
  rotationRange: number;
  cardSizeMode?: CardSizeMode;
  maxVisible?: number;
}

export interface BoardControllerReturn {
  visible: Map<string, CardPosition>;
  queue: QueuedCard[];
  cardDataMap: Map<string, CardData>;
  filteredCount: number;
  applyFilter: (searchTerm: string, category: string | null) => void;
  resetBoard: () => void;
  setPhysicsBridge: (physics: SpawnPhysicsBridge) => void;
  /** Move the search card's grid position to new canvas coordinates */
  rehomeSearchCard: (x: number, y: number) => void;
  tick: (
    camera: Camera,
    windowSize: { width: number; height: number },
    getCurrentLayouts: () => Map<string, CardPosition>,
    /** Per-frame world-space camera delta. Used to bias spawn placement
     *  toward the leading edge of the pan so cards stream in naturally. */
    velocity?: Velocity,
  ) => boolean;
}

function createQueuedCards(cards: CardData[]): QueuedCard[] {
  const queuedAt = Date.now();
  return cards.map((card) => ({
    id: card.id,
    data: card,
    queuedAt,
  }));
}

function computeViewportBounds(
  camera: Camera,
  windowSize: { width: number; height: number },
): ViewportBounds {
  const topLeft = screenToCanvas(0, 0, camera, windowSize);
  const bottomRight = screenToCanvas(windowSize.width, windowSize.height, camera, windowSize);
  return {
    x: topLeft.x,
    y: topLeft.y,
    left: topLeft.x,
    top: topLeft.y,
    right: bottomRight.x,
    bottom: bottomRight.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

function isCardInBounds(
  card: CardPosition,
  bounds: ViewportBounds,
  buffer: number,
): boolean {
  return !(
    card.x + card.width < bounds.left - buffer ||
    card.x > bounds.right + buffer ||
    card.y + card.height < bounds.top - buffer ||
    card.y > bounds.bottom + buffer
  );
}

/** Where a content card lives on the board, in grid cells. */
interface Home {
  col: number;
  row: number;
  size: CardSize;
}

function homePixels(home: Home, offset: { x: number; y: number }) {
  const pixel = cellToPixel(home.col, home.row);
  const dims = getCardDimensions(home.size);
  return { x: pixel.x - offset.x, y: pixel.y - offset.y, width: dims.width, height: dims.height };
}

/** Homes for the content cards of an initial layout. */
function homesFrom(
  positions: Map<string, CardPosition>,
  offset: { x: number; y: number },
  cards: CardData[],
): Map<string, Home> {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const homes = new Map<string, Home>();
  positions.forEach((pos, id) => {
    if (id === SEARCH_CARD_ID || isPinnedCard(byId.get(id))) return;
    const cell = pixelToCell(pos.x + offset.x, pos.y + offset.y);
    homes.set(id, { ...cell, size: pos.size });
  });
  return homes;
}

export function useBoardController({
  cards,
  rotationRange,
  cardSizeMode = 'mixed',
  maxVisible = QUEUE.MAX_VISIBLE,
}: BoardControllerOptions): BoardControllerReturn {
  const cardDataMap = useMemo(() => {
    const map = new Map<string, CardData>();
    cards.forEach((card) => map.set(card.id, card));
    return map;
  }, [cards]);

  const [initialResult] = useState(() =>
    calculateInitialPositions(
      cards,
      Math.min(QUEUE.INITIAL_SPAWN_COUNT, maxVisible),
      rotationRange,
      cardSizeMode,
    ),
  );
  const [visible, setVisibleState] = useState<Map<string, CardPosition>>(initialResult.positions);
  const [queue, setQueueState] = useState<QueuedCard[]>(() => {
    const visibleIds = new Set(initialResult.positions.keys());
    return createQueuedCards(cards.filter((card) => !visibleIds.has(card.id)));
  });

  const visibleRef = useRef(visible);
  const queueRef = useRef(queue);
  const spawnCountRef = useRef(0);
  const physicsRef = useRef<SpawnPhysicsBridge | null>(null);
  // Use the grid directly from initial placement — no reconstruction from
  // pixel positions, which would misalign due to the centering offset.
  // The grid is the board's memory: a card keeps its cells after it scrolls
  // away, so panning back finds the same card in the same place.
  const gridRef = useRef<GridOccupancy>(initialResult.grid);
  // Centering offset: add to pixel coords before pixelToCell conversion
  const originOffsetRef = useRef(initialResult.originOffset);
  // Every content card that has a place on the board, visible or parked
  // off-screen. Pinned cards and the search card never leave, so they
  // aren't listed.
  const homesRef = useRef<Map<string, Home>>(homesFrom(initialResult.positions, initialResult.originOffset, cards));
  const filterRef = useRef<{ searchTerm: string; category: string | null }>({
    searchTerm: '',
    category: null,
  });

  const setVisible = useCallback((nextVisible: Map<string, CardPosition>) => {
    visibleRef.current = nextVisible;
    setVisibleState(nextVisible);
  }, []);

  const setQueue = useCallback((nextQueue: QueuedCard[]) => {
    queueRef.current = nextQueue;
    setQueueState(nextQueue);
  }, []);

  const rebuildFromFilter = useCallback(
    (searchTerm: string, category: string | null) => {
      const filtered = filterCards(cards, searchTerm, category);
      const result = calculateInitialPositions(
        filtered,
        Math.min(QUEUE.INITIAL_SPAWN_COUNT, maxVisible),
        rotationRange,
        cardSizeMode,
      );
      const visibleIds = new Set(result.positions.keys());

      gridRef.current = result.grid;
      originOffsetRef.current = result.originOffset;
      homesRef.current = homesFrom(result.positions, result.originOffset, filtered);
      setVisible(result.positions);
      setQueue(createQueuedCards(filtered.filter((card) => !visibleIds.has(card.id))));
      physicsRef.current?.resetCards?.(result.positions);
      spawnCountRef.current = 0;
    },
    [cards, maxVisible, rotationRange, cardSizeMode, setQueue, setVisible],
  );

  /**
   * Diff-style filter update — keeps any card whose filter membership didn't
   * change at its current grid cell, forgets the places of cards that no
   * longer match, and queues newly-matching cards for normal spawn.
   *
   * Avoids the "shuffle every card" effect of rebuilding from origin while
   * still reusing the grid + origin offset so the search card stays put.
   */
  const applyFilter = useCallback(
    (searchTerm: string, category: string | null) => {
      filterRef.current = { searchTerm, category };

      const filtered = filterCards(cards, searchTerm, category);
      const matchingIds = new Set(filtered.map((card) => card.id));
      const grid = gridRef.current;
      const homes = homesRef.current;

      const nextVisible = new Map<string, CardPosition>();
      visibleRef.current.forEach((pos, cardId) => {
        if (cardId === SEARCH_CARD_ID || matchingIds.has(cardId)) {
          nextVisible.set(cardId, pos);
        } else {
          grid.release(cardId);
        }
      });
      for (const cardId of [...homes.keys()]) {
        if (!matchingIds.has(cardId)) {
          grid.release(cardId);
          homes.delete(cardId);
        }
      }

      const nextQueue: QueuedCard[] = filtered
        .filter((card) => !nextVisible.has(card.id) && !homes.has(card.id))
        .map((card) => ({ id: card.id, data: card, queuedAt: Date.now() }));

      setVisible(nextVisible);
      setQueue(nextQueue);
    },
    [cards, setQueue, setVisible],
  );

  const resetBoard = useCallback(() => {
    rebuildFromFilter(filterRef.current.searchTerm, filterRef.current.category);
  }, [rebuildFromFilter]);

  const setPhysicsBridge = useCallback((physics: SpawnPhysicsBridge) => {
    physicsRef.current = physics;
  }, []);

  /**
   * Re-anchor the search card near canvas (x, y). Cards already there are
   * never thrown away: each one slides to the nearest free slot instead.
   * Pinned cards (intro, experience, about) are never displaced; the search
   * card takes the nearest slot clear of them.
   */
  const rehomeSearchCard = useCallback(
    (x: number, y: number) => {
      const current = visibleRef.current.get(SEARCH_CARD_ID);
      if (!current) return;

      const grid = gridRef.current;
      const homes = homesRef.current;
      const offset = originOffsetRef.current;
      grid.release(SEARCH_CARD_ID);

      const { cols, rows } = sizeToSpan(current.size);
      const occupantsAt = (col: number, row: number) => {
        const ids = new Set<string>();
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const id = grid.getCardAt(col + c, row + r);
            if (id) ids.add(id);
          }
        }
        return ids;
      };
      const clearOfPinned = (col: number, row: number) =>
        [...occupantsAt(col, row)].every((id) => !isPinnedCard(cardDataMap.get(id)));

      // Nearest slot (spiralling out from the target) that covers no pinned card.
      const target = pixelToCell(x + offset.x, y + offset.y);
      let cell = target;
      search: for (let radius = 0; radius <= 6; radius++) {
        for (let dc = -radius; dc <= radius; dc++) {
          for (let dr = -radius; dr <= radius; dr++) {
            if (Math.max(Math.abs(dc), Math.abs(dr)) !== radius) continue;
            if (clearOfPinned(target.col + dc, target.row + dr)) {
              cell = { col: target.col + dc, row: target.row + dr };
              break search;
            }
          }
        }
      }

      const displaced = [...occupantsAt(cell.col, cell.row)];
      displaced.forEach((id) => grid.release(id));
      grid.place(cell.col, cell.row, current.size, SEARCH_CARD_ID);

      const nextVisible = new Map(visibleRef.current);
      const nextQueue = [...queueRef.current];
      let queueChanged = false;
      for (const id of displaced) {
        const home = homes.get(id);
        if (!home) continue;
        const moved = grid.findNearest(home.col, home.row, home.size);
        if (!moved) {
          // Nowhere near to go: forget its place and let it spawn again later.
          homes.delete(id);
          nextVisible.delete(id);
          const card = cardDataMap.get(id);
          if (card) nextQueue.push({ id, data: card, queuedAt: Date.now() });
          queueChanged = true;
          continue;
        }
        grid.place(moved.col, moved.row, home.size, id);
        const nextHome = { ...moved, size: home.size };
        homes.set(id, nextHome);
        const shown = nextVisible.get(id);
        if (shown) nextVisible.set(id, { ...shown, ...homePixels(nextHome, offset) });
      }

      const pixel = cellToPixel(cell.col, cell.row);
      nextVisible.set(SEARCH_CARD_ID, {
        ...current,
        x: pixel.x - offset.x,
        y: pixel.y - offset.y,
      });
      setVisible(nextVisible);
      if (queueChanged) setQueue(nextQueue);
    },
    [cardDataMap, setQueue, setVisible],
  );

  // -----------------------------------------------------------------------
  // tick() — called every rAF frame
  // -----------------------------------------------------------------------
  const tick = useCallback(
    (
      camera: Camera,
      windowSize: { width: number; height: number },
      getCurrentLayouts: () => Map<string, CardPosition>,
      velocity: Velocity = { x: 0, y: 0 },
    ) => {
      const bounds = computeViewportBounds(camera, windowSize);
      const currentLayouts = getCurrentLayouts();
      const grid = gridRef.current;
      const homes = homesRef.current;
      const offset = originOffsetRef.current;

      const nextVisible = new Map(visibleRef.current);
      const nextQueue = [...queueRef.current];
      let changed = false;
      let queueChanged = false;

      // --- Park: cards that left the viewport stop rendering but keep their
      // place, so panning back shows the same card in the same slot. ---
      nextVisible.forEach((fallbackPosition, cardId) => {
        // Search and pinned cards never despawn
        if (cardId === SEARCH_CARD_ID || isPinnedCard(cardDataMap.get(cardId))) return;

        const currentPosition = currentLayouts.get(cardId) ?? fallbackPosition;
        if (isCardInBounds(currentPosition, bounds, GRID.DESPAWN_BUFFER)) return;

        nextVisible.delete(cardId);
        changed = true;
      });

      // --- Restore: parked cards whose place comes back into range. The
      // spawn buffer is smaller than the despawn buffer, so a card at the
      // edge doesn't flicker between the two. ---
      homes.forEach((home, cardId) => {
        if (nextVisible.has(cardId)) return;
        const position = { ...homePixels(home, offset), size: home.size, rotation: 0 };
        if (!isCardInBounds(position, bounds, GRID.SPAWN_BUFFER)) return;
        nextVisible.set(cardId, position);
        changed = true;
      });

      // --- Grow: place new cards in unexplored space near the viewport ---
      // Count cards within the spawn buffer as "on screen" to avoid the
      // feedback loop where buffer-zone cards inflate the deficit.
      let onScreenCount = 0;
      nextVisible.forEach((pos, cardId) => {
        const current = currentLayouts.get(cardId) ?? pos;
        if (isCardInBounds(current, bounds, GRID.SPAWN_BUFFER)) {
          onScreenCount++;
        }
      });

      // Adaptive cap: scale with viewport area so wide screens fill their
      // corners. Floor uses the configured `maxVisible` so small displays
      // never go below the original budget; ceiling keeps memory bounded.
      const cellStep = GRID.CELL_SIZE + GRID.GAP;
      const viewportCells = Math.ceil((bounds.width / cellStep) * (bounds.height / cellStep));
      const ABS_MAX_VISIBLE = 72;
      const dynamicMaxVisible = Math.min(
        ABS_MAX_VISIBLE,
        Math.max(maxVisible, Math.ceil(viewportCells * 1.3)),
      );
      const deficit = dynamicMaxVisible - onScreenCount;

      if (deficit > 0) {
        const viewCenterX = bounds.left + bounds.width / 2;
        const viewCenterY = bounds.top + bounds.height / 2;

        // Direction-aware anchor: when the camera is panning, push the search
        // anchor toward the leading edge so new cards stream in from where the
        // user is heading rather than the closest gap behind them.
        // Camera transform translates content by camera.x/y, so a positive
        // velocity.x means content moves right and the LEADING edge in world
        // coords is the LEFT side — the anchor offset is the negation.
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const VELOCITY_THRESHOLD = 0.5;
        let anchorX = viewCenterX;
        let anchorY = viewCenterY;
        if (speed > VELOCITY_THRESHOLD) {
          const reach = Math.min(bounds.width, bounds.height) * 0.4;
          anchorX = viewCenterX - (velocity.x / speed) * reach;
          anchorY = viewCenterY - (velocity.y / speed) * reach;
        }
        const center = pixelToCell(anchorX + offset.x, anchorY + offset.y);

        const cellRect = (cell: { col: number; row: number }, cellSize: CardSize) => {
          const dims = getCardDimensions(cellSize);
          const pixel = cellToPixel(cell.col, cell.row);
          return { x: pixel.x - offset.x, y: pixel.y - offset.y, width: dims.width, height: dims.height };
        };
        // New cards only go into unexplored slots the visitor can (nearly)
        // see: inside the spawn buffer. The anchor leans toward the leading
        // edge, so while panning the slots ahead fill first; a hole already
        // in view fills in place (cards fade in) rather than staying empty.
        const accept = (cell: { col: number; row: number }, cellSize: CardSize): boolean =>
          isCardInBounds({ ...cellRect(cell, cellSize), size: cellSize, rotation: 0 }, bounds, GRID.SPAWN_BUFFER);

        // Sources already in range — prefer a different project over a
        // copy of one the visitor can see, but never leave a hole for it.
        const inRange = new Set<string>();
        nextVisible.forEach((_pos, id) => inRange.add(stripCloneSuffix(id)));

        // Parked cards far out of range can be re-placed once the queue runs
        // dry: the board forgets the places furthest from the visitor first.
        const recyclable = () =>
          [...homes.entries()]
            .filter(([id, home]) => {
              if (nextVisible.has(id)) return false;
              const rect = { ...homePixels(home, offset), size: home.size, rotation: 0 };
              return !isCardInBounds(rect, bounds, GRID.DESPAWN_BUFFER * 3);
            })
            .map(([id, home]) => {
              const px = homePixels(home, offset);
              return { id, dist: (px.x - viewCenterX) ** 2 + (px.y - viewCenterY) ** 2 };
            })
            .sort((a, b) => b.dist - a.dist);

        // Far enough to reach past the spawn buffer from the anchor, no further.
        const searchRadius = Math.ceil(Math.max(bounds.width, bounds.height) / cellStep) + 2;
        const spawnCount = Math.min(deficit, 6);
        let recycled: { id: string; dist: number }[] | null = null;

        for (let i = 0; i < spawnCount; i++) {
          // Pick a card: an unplaced one (preferring a project not in range),
          // or failing that, the parked card whose place is furthest away.
          let queuedCard: QueuedCard | undefined;
          let fromQueue = -1;
          if (nextQueue.length > 0) {
            fromQueue = nextQueue.findIndex((q) => !inRange.has(stripCloneSuffix(q.id)));
            if (fromQueue === -1) fromQueue = 0;
            queuedCard = nextQueue[fromQueue];
          } else {
            recycled ??= recyclable();
            const pickAt = Math.max(0, recycled.findIndex((r) => !inRange.has(stripCloneSuffix(r.id))));
            const pick = recycled[pickAt];
            const data = pick && cardDataMap.get(pick.id);
            if (pick && data) {
              recycled.splice(pickAt, 1);
              queuedCard = { id: pick.id, data, queuedAt: Date.now() };
            }
          }
          if (!queuedCard) break;

          const size = getCardSizeForIndex(spawnCountRef.current, queuedCard.data, cardSizeMode);
          const cell = grid.findNearest(center.col, center.row, size, { accept, maxRadius: searchRadius });
          // Nothing free within range: the area is full (or remembered).
          if (!cell) break;

          if (fromQueue !== -1) {
            nextQueue.splice(fromQueue, 1);
            queueChanged = true;
          } else {
            grid.release(queuedCard.id);
          }

          grid.place(cell.col, cell.row, size, queuedCard.id);
          const home = { col: cell.col, row: cell.row, size };
          homes.set(queuedCard.id, home);
          nextVisible.set(queuedCard.id, {
            ...homePixels(home, offset),
            size,
            rotation: getRandomRotation(rotationRange),
          });
          inRange.add(stripCloneSuffix(queuedCard.id));
          spawnCountRef.current++;
          changed = true;
        }
      }

      if (!changed) return false;

      setVisible(nextVisible);
      if (queueChanged) setQueue(nextQueue);
      return true;
    },
    [cardDataMap, maxVisible, rotationRange, cardSizeMode, setQueue, setVisible],
  );

  return {
    visible,
    queue,
    cardDataMap,
    filteredCount: Math.max(0, visible.size + queue.length - (visible.has(SEARCH_CARD_ID) ? 1 : 0)),
    applyFilter,
    resetBoard,
    setPhysicsBridge,
    rehomeSearchCard,
    tick,
  };
}
