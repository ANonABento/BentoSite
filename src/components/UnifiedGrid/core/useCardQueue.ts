/**
 * useCardQueue - FILO Queue System for Card Recycling
 *
 * Manages the lifecycle of cards in the infinite grid:
 * - Cards exit viewport → added to queue (end)
 * - Spawn needed → pop from queue (front)
 * - Creates organic cycling effect with delays
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  CardData,
  CardPosition,
  QueuedCard,
  UseCardQueueReturn,
  CardSize,
} from '../UnifiedGrid.types';
import { QUEUE, GRID, getCardDimensions } from '../UnifiedGrid.constants';

interface UseCardQueueOptions {
  /** All available cards */
  cards: CardData[];
  /** Maximum visible cards (for performance) */
  maxVisible?: number;
  /** Theme rotation range for random tilt */
  rotationRange?: number;
}

/**
 * Assigns card sizes based on index pattern for visual variety
 */
function getCardSize(index: number, featured?: boolean): CardSize {
  if (featured) return '2x2';

  // Pattern: mostly 1x1, some 2x1 and 1x2 for variety
  const pattern: CardSize[] = ['1x1', '1x1', '2x1', '1x1', '1x2', '1x1', '1x1', '1x1'];
  return pattern[index % pattern.length];
}

/**
 * Generates a random rotation within range
 */
function getRandomRotation(range: number): number {
  if (range === 0) return 0;
  return (Math.random() - 0.5) * 2 * range;
}

/**
 * Calculates initial positions in a spiral pattern from center
 */
function calculateInitialPositions(
  cards: CardData[],
  count: number,
  rotationRange: number
): Map<string, CardPosition> {
  const positions = new Map<string, CardPosition>();
  const placed: Array<{ x: number; y: number; width: number; height: number }> = [];

  // Leave space in center for search card
  const searchCardSpace = {
    x: -GRID.CELL_SIZE,
    y: -GRID.CELL_SIZE / 2,
    width: GRID.CELL_SIZE * 2 + GRID.GAP,
    height: GRID.CELL_SIZE + GRID.GAP,
  };
  placed.push(searchCardSpace);

  // Spiral outward from center
  const spiralPositions = generateSpiralPositions(count + 10); // Extra for collision retries

  // First pass: calculate all positions
  const tempPositions: Array<{ id: string; x: number; y: number; size: CardSize; width: number; height: number }> = [];
  let cardIndex = 0;
  let spiralIndex = 0;

  while (cardIndex < Math.min(count, cards.length) && spiralIndex < spiralPositions.length) {
    const card = cards[cardIndex];
    const spiralPos = spiralPositions[spiralIndex];

    const featured = card.type === 'project' && (card as { featured?: boolean }).featured;
    const size = getCardSize(cardIndex, featured);
    const dimensions = getCardDimensions(size);

    // Calculate pixel position from grid cell
    const x = spiralPos.col * (GRID.CELL_SIZE + GRID.GAP);
    const y = spiralPos.row * (GRID.CELL_SIZE + GRID.GAP);

    // Check for collision with existing cards
    const cardRect = { x, y, width: dimensions.width, height: dimensions.height };
    const hasCollision = placed.some((p) => rectsOverlap(cardRect, p));

    if (!hasCollision) {
      tempPositions.push({
        id: card.id,
        x,
        y,
        size,
        width: dimensions.width,
        height: dimensions.height,
      });
      placed.push(cardRect);
      cardIndex++;
    }

    spiralIndex++;
  }

  // Calculate bounding box center and offset to center cards around origin
  if (tempPositions.length > 0) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    tempPositions.forEach((pos) => {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x + pos.width);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y + pos.height);
    });

    const centerOffsetX = (minX + maxX) / 2;
    const centerOffsetY = (minY + maxY) / 2;

    // Apply offset to center cards around origin
    tempPositions.forEach((pos) => {
      positions.set(pos.id, {
        x: pos.x - centerOffsetX,
        y: pos.y - centerOffsetY,
        rotation: getRandomRotation(rotationRange),
        size: pos.size,
        width: pos.width,
        height: pos.height,
      });
    });
  }

  return positions;
}

/**
 * Generates grid cell positions in a spiral pattern from center
 */
function generateSpiralPositions(count: number): Array<{ col: number; row: number }> {
  const positions: Array<{ col: number; row: number }> = [];
  let col = 0;
  let row = 0;
  let direction = 0; // 0=right, 1=down, 2=left, 3=up
  let stepsInDirection = 1;
  let stepsTaken = 0;
  let directionChanges = 0;

  for (let i = 0; i < count; i++) {
    positions.push({ col, row });

    // Move in current direction
    switch (direction) {
      case 0: col++; break;
      case 1: row++; break;
      case 2: col--; break;
      case 3: row--; break;
    }
    stepsTaken++;

    // Change direction when needed
    if (stepsTaken >= stepsInDirection) {
      stepsTaken = 0;
      direction = (direction + 1) % 4;
      directionChanges++;

      // Increase step count every 2 direction changes
      if (directionChanges % 2 === 0) {
        stepsInDirection++;
      }
    }
  }

  return positions;
}

/**
 * Check if two rectangles overlap
 */
function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  const padding = GRID.GAP;
  return !(
    a.x + a.width + padding <= b.x ||
    b.x + b.width + padding <= a.x ||
    a.y + a.height + padding <= b.y ||
    b.y + b.height + padding <= a.y
  );
}

/**
 * Filter cards by search term and category
 */
function filterCards(
  cards: CardData[],
  searchTerm: string,
  category: string | null
): CardData[] {
  const term = searchTerm.toLowerCase().trim();

  return cards.filter((card) => {
    // Category filter
    if (category && card.category !== category) {
      return false;
    }

    // Search filter
    if (term) {
      const matchTitle = card.title.toLowerCase().includes(term);
      const matchDesc = card.description?.toLowerCase().includes(term);
      const matchCategory = card.category?.toLowerCase().includes(term);

      // Project-specific: search technologies
      if (card.type === 'project') {
        const projectCard = card as { technologies?: string[] };
        const matchTech = projectCard.technologies?.some((t) =>
          t.toLowerCase().includes(term)
        );
        return matchTitle || matchDesc || matchCategory || matchTech;
      }

      return matchTitle || matchDesc || matchCategory;
    }

    return true;
  });
}

export function useCardQueue(options: UseCardQueueOptions): UseCardQueueReturn {
  const { cards, maxVisible = QUEUE.MAX_VISIBLE, rotationRange = 0 } = options;

  // Build card data map for quick lookup
  const cardDataMap = useMemo(() => {
    const map = new Map<string, CardData>();
    cards.forEach((card) => map.set(card.id, card));
    return map;
  }, [cards]);

  // Current filter state
  const [filterState, setFilterState] = useState<{
    searchTerm: string;
    category: string | null;
  }>({ searchTerm: '', category: null });

  // Filtered cards based on current filter
  const filteredCards = useMemo(
    () => filterCards(cards, filterState.searchTerm, filterState.category),
    [cards, filterState.searchTerm, filterState.category]
  );

  // Currently visible cards with positions
  const [visible, setVisible] = useState<Map<string, CardPosition>>(() =>
    calculateInitialPositions(
      filteredCards,
      Math.min(QUEUE.INITIAL_SPAWN_COUNT, maxVisible),
      rotationRange
    )
  );

  // Queue of cards waiting to spawn (FILO: first in, last out)
  const [queue, setQueue] = useState<QueuedCard[]>(() => {
    // Initialize queue with cards not in initial visible set
    const visibleIds = new Set(visible.keys());
    return filteredCards
      .filter((card) => !visibleIds.has(card.id))
      .map((card) => ({
        id: card.id,
        data: card,
        queuedAt: Date.now(),
      }));
  });

  // Track last spawn time for delay
  const lastSpawnTimeRef = useRef<number>(0);

  /**
   * Add a card to the spawn queue (when it exits viewport)
   */
  const enqueue = useCallback((cardId: string) => {
    const cardData = cardDataMap.get(cardId);
    if (!cardData) return;

    setQueue((prev) => [
      ...prev,
      {
        id: cardId,
        data: cardData,
        queuedAt: Date.now(),
      },
    ]);
  }, [cardDataMap]);

  /**
   * Remove and return the next card from queue (FILO)
   */
  const dequeue = useCallback((): QueuedCard | undefined => {
    const now = Date.now();

    // Enforce minimum delay between spawns
    if (now - lastSpawnTimeRef.current < QUEUE.SPAWN_DELAY) {
      return undefined;
    }

    let dequeuedCard: QueuedCard | undefined;

    setQueue((prev) => {
      if (prev.length === 0) return prev;

      // FILO: take from front (first in, last out)
      dequeuedCard = prev[0];
      lastSpawnTimeRef.current = now;

      return prev.slice(1);
    });

    return dequeuedCard;
  }, []);

  /**
   * Remove a card from visible set (when it exits viewport)
   */
  const removeVisible = useCallback((cardId: string) => {
    setVisible((prev) => {
      const next = new Map(prev);
      next.delete(cardId);
      return next;
    });

    // Add to queue for respawning
    enqueue(cardId);
  }, [enqueue]);

  /**
   * Add a card to the visible set with position
   */
  const addVisible = useCallback((cardId: string, position: CardPosition) => {
    // Don't exceed max visible
    setVisible((prev) => {
      if (prev.size >= maxVisible) return prev;

      const next = new Map(prev);
      next.set(cardId, position);
      return next;
    });
  }, [maxVisible]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    const initialVisible = calculateInitialPositions(
      filteredCards,
      Math.min(QUEUE.INITIAL_SPAWN_COUNT, maxVisible),
      rotationRange
    );

    setVisible(initialVisible);

    const visibleIds = new Set(initialVisible.keys());
    setQueue(
      filteredCards
        .filter((card) => !visibleIds.has(card.id))
        .map((card) => ({
          id: card.id,
          data: card,
          queuedAt: Date.now(),
        }))
    );

    lastSpawnTimeRef.current = 0;
  }, [filteredCards, maxVisible, rotationRange]);

  /**
   * Apply search/category filter
   */
  const applyFilter = useCallback((searchTerm: string, category: string | null) => {
    setFilterState({ searchTerm, category });
  }, []);

  // Re-initialize visible set and queue whenever the filtered card identity set
  // changes (search/category filter). Tracking the id signature avoids resetting
  // on every parent re-render where `cards` is a new array reference.
  const filteredSignatureRef = useRef<string>('');
  useEffect(() => {
    const signature = filteredCards.map((c) => c.id).sort().join('|');
    if (signature === filteredSignatureRef.current) return;
    filteredSignatureRef.current = signature;

    const nextVisible = calculateInitialPositions(
      filteredCards,
      Math.min(QUEUE.INITIAL_SPAWN_COUNT, maxVisible),
      rotationRange
    );
    setVisible(nextVisible);

    const visibleIds = new Set(nextVisible.keys());
    setQueue(
      filteredCards
        .filter((card) => !visibleIds.has(card.id))
        .map((card) => ({
          id: card.id,
          data: card,
          queuedAt: Date.now(),
        }))
    );
    lastSpawnTimeRef.current = 0;
  }, [filteredCards, maxVisible, rotationRange]);

  return {
    visible,
    queue,
    enqueue,
    dequeue,
    removeVisible,
    addVisible,
    reset,
    applyFilter,
  };
}
