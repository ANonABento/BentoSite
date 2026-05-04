/**
 * useBoardController - Grid Layout, Spawn/Despawn & Search Card Rehoming
 *
 * Manages the board's visible card set and spawn queue. On each rAF tick,
 * cards outside the viewport are despawned (returned to the queue) and
 * queued cards are spawned into the nearest available grid cells.
 *
 * The search card is special: it never despawns and can be rehomed to a
 * new grid cell via rehomeSearchCard, evicting any content cards that
 * occupy the target cell.
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
} from '../BentoGrid.types';
import { GRID, QUEUE, SEARCH_CARD_ID } from '../BentoGrid.constants';
import {
  calculateInitialPositions,
  getCardDimensions,
  getCardSizeForIndex,
  getRandomRotation,
  GridOccupancy,
  cellToPixel,
  pixelToCell,
  sizeToSpan,
  occupancyFromPositions,
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
  ) => void;
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

  const [visible, setVisibleState] = useState<Map<string, CardPosition>>(() =>
    calculateInitialPositions(
      cards,
      Math.min(QUEUE.INITIAL_SPAWN_COUNT, maxVisible),
      rotationRange,
      cardSizeMode,
    ),
  );
  const [queue, setQueueState] = useState<QueuedCard[]>(() => {
    const visibleIds = new Set(visible.keys());
    return createQueuedCards(cards.filter((card) => !visibleIds.has(card.id)));
  });

  const visibleRef = useRef(visible);
  const queueRef = useRef(queue);
  const spawnCountRef = useRef(0);
  const physicsRef = useRef<SpawnPhysicsBridge | null>(null);
  const gridRef = useRef<GridOccupancy>(occupancyFromPositions(visible));
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
      const nextVisible = calculateInitialPositions(
        filtered,
        Math.min(QUEUE.INITIAL_SPAWN_COUNT, maxVisible),
        rotationRange,
        cardSizeMode,
      );
      const visibleIds = new Set(nextVisible.keys());

      gridRef.current = occupancyFromPositions(nextVisible);
      setVisible(nextVisible);
      setQueue(createQueuedCards(filtered.filter((card) => !visibleIds.has(card.id))));
      physicsRef.current?.resetCards?.(nextVisible);
      spawnCountRef.current = 0;
    },
    [cards, maxVisible, rotationRange, cardSizeMode, setQueue, setVisible],
  );

  const applyFilter = useCallback(
    (searchTerm: string, category: string | null) => {
      filterRef.current = { searchTerm, category };
      rebuildFromFilter(searchTerm, category);
    },
    [rebuildFromFilter],
  );

  const resetBoard = useCallback(() => {
    rebuildFromFilter(filterRef.current.searchTerm, filterRef.current.category);
  }, [rebuildFromFilter]);

  const setPhysicsBridge = useCallback((physics: SpawnPhysicsBridge) => {
    physicsRef.current = physics;
  }, []);

  const rehomeSearchCard = useCallback(
    (x: number, y: number) => {
      const current = visibleRef.current.get(SEARCH_CARD_ID);
      if (!current) return;

      const grid = gridRef.current;

      // Release old grid cells
      grid.release(SEARCH_CARD_ID);

      // Place at the exact target cell. If occupied, evict the content
      // cards there — the search card always wins its position.
      const cell = pixelToCell(x, y);
      const nextVisible = new Map(visibleRef.current);
      const nextQueue = [...queueRef.current];
      let evicted = false;

      if (!grid.canPlace(cell.col, cell.row, current.size)) {
        const { cols, rows } = sizeToSpan(current.size);
        const evictIds = new Set<string>();
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const occupant = grid.getCardAt(cell.col + c, cell.row + r);
            if (occupant && occupant !== SEARCH_CARD_ID) {
              evictIds.add(occupant);
            }
          }
        }
        for (const evictId of evictIds) {
          grid.release(evictId);
          nextVisible.delete(evictId);
          const card = cardDataMap.get(evictId);
          if (card) {
            nextQueue.push({ id: evictId, data: card, queuedAt: Date.now() });
          }
          evicted = true;
        }
      }

      grid.place(cell.col, cell.row, current.size, SEARCH_CARD_ID);
      const pixel = cellToPixel(cell.col, cell.row);

      nextVisible.set(SEARCH_CARD_ID, {
        ...current,
        x: pixel.x,
        y: pixel.y,
      });
      setVisible(nextVisible);
      if (evicted) {
        setQueue(nextQueue);
      }
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
    ) => {
      const bounds = computeViewportBounds(camera, windowSize);
      const currentLayouts = getCurrentLayouts();
      const grid = gridRef.current;

      const nextVisible = new Map(visibleRef.current);
      const nextQueue = [...queueRef.current];
      let changed = false;

      // --- Despawn: recycle cards that left the viewport ---
      nextVisible.forEach((fallbackPosition, cardId) => {
        // Search card never despawns
        if (cardId === SEARCH_CARD_ID) return;

        const currentPosition = currentLayouts.get(cardId) ?? fallbackPosition;
        if (isCardInBounds(currentPosition, bounds, GRID.DESPAWN_BUFFER)) return;

        const card = cardDataMap.get(cardId);
        if (!card) return;

        nextVisible.delete(cardId);
        grid.release(cardId);
        nextQueue.push({ id: cardId, data: card, queuedAt: Date.now() });
        changed = true;
      });

      // --- Spawn: fill viewport with queued cards on grid cells ---
      let onScreenCount = 0;
      nextVisible.forEach((pos, cardId) => {
        const current = currentLayouts.get(cardId) ?? pos;
        if (isCardInBounds(current, bounds, 0)) {
          onScreenCount++;
        }
      });

      const totalCards = nextVisible.size + nextQueue.length;
      const targetOnScreen = Math.min(QUEUE.INITIAL_SPAWN_COUNT, maxVisible, totalCards);
      const deficit = targetOnScreen - onScreenCount;

      if (deficit > 0 && nextQueue.length > 0) {
        // Find the grid cell at the viewport center
        const viewCenterX = bounds.left + bounds.width / 2;
        const viewCenterY = bounds.top + bounds.height / 2;
        const center = pixelToCell(viewCenterX, viewCenterY);

        const spawnCount = Math.min(deficit, nextQueue.length, maxVisible - nextVisible.size);

        for (let i = 0; i < spawnCount; i++) {
          const queuedCard = nextQueue.shift()!;
          const size = getCardSizeForIndex(spawnCountRef.current, queuedCard.data, cardSizeMode);
          const dimensions = getCardDimensions(size);

          // Find nearest available grid cell from viewport center
          const cell = grid.findNearest(center.col, center.row, size);
          if (!cell) continue;

          grid.place(cell.col, cell.row, size, queuedCard.id);
          const pixel = cellToPixel(cell.col, cell.row);

          const position: CardPosition = {
            x: pixel.x,
            y: pixel.y,
            width: dimensions.width,
            height: dimensions.height,
            size,
            rotation: getRandomRotation(rotationRange),
          };

          nextVisible.set(queuedCard.id, position);
          spawnCountRef.current++;
          changed = true;
        }
      }

      if (!changed) return;

      setVisible(nextVisible);
      setQueue(nextQueue);
    },
    [cardDataMap, maxVisible, rotationRange, cardSizeMode, setQueue, setVisible],
  );

  return {
    visible,
    queue,
    cardDataMap,
    filteredCount: Math.max(0, visible.size + queue.length - 1), // exclude search card
    applyFilter,
    resetBoard,
    setPhysicsBridge,
    rehomeSearchCard,
    tick,
  };
}
