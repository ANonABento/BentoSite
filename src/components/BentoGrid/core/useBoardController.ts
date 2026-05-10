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
  CardSize,
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
  const gridRef = useRef<GridOccupancy>(initialResult.grid);
  // Centering offset: add to pixel coords before pixelToCell conversion
  const originOffsetRef = useRef(initialResult.originOffset);
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
      setVisible(result.positions);
      setQueue(createQueuedCards(filtered.filter((card) => !visibleIds.has(card.id))));
      physicsRef.current?.resetCards?.(result.positions);
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
      const offset = originOffsetRef.current;
      const cell = pixelToCell(x + offset.x, y + offset.y);
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
        x: pixel.x - offset.x,
        y: pixel.y - offset.y,
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
      // Count cards within the spawn buffer as "on screen" to avoid the
      // feedback loop where buffer-zone cards inflate the deficit.
      let onScreenCount = 0;
      nextVisible.forEach((pos, cardId) => {
        const current = currentLayouts.get(cardId) ?? pos;
        if (isCardInBounds(current, bounds, GRID.SPAWN_BUFFER)) {
          onScreenCount++;
        }
      });

      const totalCards = nextVisible.size + nextQueue.length;
      const targetOnScreen = Math.min(maxVisible, totalCards);
      const deficit = targetOnScreen - onScreenCount;

      if (deficit > 0 && nextQueue.length > 0) {
        // Convert viewport center to grid cell, accounting for centering offset.
        // Pixel positions are shifted by originOffset; add it back to get true grid coords.
        const offset = originOffsetRef.current;
        const viewCenterX = bounds.left + bounds.width / 2;
        const viewCenterY = bounds.top + bounds.height / 2;
        const center = pixelToCell(viewCenterX + offset.x, viewCenterY + offset.y);

        // Cap spawns per tick to prevent clustering
        const spawnCount = Math.min(deficit, nextQueue.length, maxVisible - nextVisible.size, 3);

        // Reject candidates that overlap the visible viewport — cards must
        // appear outside the screen and stream in as the user pans, not
        // teleport into the middle of the visible area.
        const isOutsideViewport = (
          cell: { col: number; row: number },
          cellSize: CardSize,
        ): boolean => {
          const dims = getCardDimensions(cellSize);
          const pixel = cellToPixel(cell.col, cell.row);
          const cardLeft = pixel.x - offset.x;
          const cardTop = pixel.y - offset.y;
          const cardRight = cardLeft + dims.width;
          const cardBottom = cardTop + dims.height;
          return (
            cardRight <= bounds.left ||
            cardLeft >= bounds.right ||
            cardBottom <= bounds.top ||
            cardTop >= bounds.bottom
          );
        };

        for (let i = 0; i < spawnCount; i++) {
          const queuedCard = nextQueue.shift();
          if (!queuedCard) break;
          const size = getCardSizeForIndex(spawnCountRef.current, queuedCard.data, cardSizeMode);
          const dimensions = getCardDimensions(size);

          // Nearest free cell that sits OUTSIDE the visible viewport.
          // If none is available within search radius this tick, skip — the
          // queued card stays at the head and we try again next frame.
          const cell = grid.findNearest(center.col, center.row, size, {
            accept: isOutsideViewport,
          });
          if (!cell) {
            // Put the card back at the head of the queue so we don't lose it.
            nextQueue.unshift(queuedCard);
            break;
          }

          grid.place(cell.col, cell.row, size, queuedCard.id);
          // Convert grid cell back to pixel position with centering offset
          const pixel = cellToPixel(cell.col, cell.row);

          const position: CardPosition = {
            x: pixel.x - offset.x,
            y: pixel.y - offset.y,
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
    filteredCount: Math.max(0, visible.size + queue.length - (visible.has(SEARCH_CARD_ID) ? 1 : 0)),
    applyFilter,
    resetBoard,
    setPhysicsBridge,
    rehomeSearchCard,
    tick,
  };
}
