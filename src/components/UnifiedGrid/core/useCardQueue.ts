/**
 * useCardQueue - FILO Queue System for Card Recycling
 *
 * Manages the lifecycle of cards in the infinite grid:
 * - Cards exit viewport → added to queue (end)
 * - Spawn needed → pop from queue (front)
 * - Creates organic cycling effect with delays
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import type {
  CardData,
  CardPosition,
  QueuedCard,
  UseCardQueueReturn,
} from '../UnifiedGrid.types';
import { QUEUE } from '../UnifiedGrid.constants';
import { filterCards } from './cardQueue/filter';
import { calculateInitialPositions } from './cardQueue/positions';

interface UseCardQueueOptions {
  /** All available cards */
  cards: CardData[];
  /** Maximum visible cards (for performance) */
  maxVisible?: number;
  /** Theme rotation range for random tilt */
  rotationRange?: number;
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
   * Apply search/category filter and synchronously reset visible/queue so the
   * grid reflects the new filter immediately (without waiting for pan-driven
   * despawn/spawn cycles). Runs in the user's event handler rather than an
   * effect to avoid cascading re-renders.
   */
  const applyFilter = useCallback(
    (searchTerm: string, category: string | null) => {
      setFilterState({ searchTerm, category });

      const filtered = filterCards(cards, searchTerm, category);
      const nextVisible = calculateInitialPositions(
        filtered,
        Math.min(QUEUE.INITIAL_SPAWN_COUNT, maxVisible),
        rotationRange
      );
      setVisible(nextVisible);

      const visibleIds = new Set(nextVisible.keys());
      setQueue(
        filtered
          .filter((card) => !visibleIds.has(card.id))
          .map((card) => ({
            id: card.id,
            data: card,
            queuedAt: Date.now(),
          }))
      );
      lastSpawnTimeRef.current = 0;
    },
    [cards, maxVisible, rotationRange]
  );

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
