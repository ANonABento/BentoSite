/**
 * useCardPool - FIFO visible/waiting card pool.
 *
 * Cards leaving the viewport are appended to the waiting queue. Spawns remove
 * from the front of that queue, preserving first-in-first-out recycling.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  CardData,
  CardPosition,
  QueuedCard,
  UseCardPoolReturn,
} from '../BentoGrid.types';
import { QUEUE } from '../BentoGrid.constants';
import { calculateInitialPositions } from '../layout/positions';
import { filterCards } from './cardPoolFilter';

interface UseCardPoolOptions {
  cards: CardData[];
  maxVisible?: number;
  rotationRange?: number;
}

function createQueuedCards(cards: CardData[]): QueuedCard[] {
  const queuedAt = Date.now();
  return cards.map((card) => ({
    id: card.id,
    data: card,
    queuedAt,
  }));
}

export function useCardPool(options: UseCardPoolOptions): UseCardPoolReturn {
  const { cards, maxVisible = QUEUE.MAX_VISIBLE, rotationRange = 0 } = options;

  const cardDataMap = useMemo(() => {
    const map = new Map<string, CardData>();
    cards.forEach((card) => map.set(card.id, card));
    return map;
  }, [cards]);

  const [filterState, setFilterState] = useState<{
    searchTerm: string;
    category: string | null;
  }>({ searchTerm: '', category: null });

  const filteredCards = useMemo(
    () => filterCards(cards, filterState.searchTerm, filterState.category),
    [cards, filterState.searchTerm, filterState.category],
  );

  const [visible, setVisible] = useState<Map<string, CardPosition>>(() =>
    calculateInitialPositions(
      filteredCards,
      Math.min(QUEUE.INITIAL_SPAWN_COUNT, maxVisible),
      rotationRange,
    ),
  );

  const [queue, setQueueState] = useState<QueuedCard[]>(() => {
    const visibleIds = new Set(visible.keys());
    return createQueuedCards(filteredCards.filter((card) => !visibleIds.has(card.id)));
  });

  const visibleRef = useRef(visible);
  const queueRef = useRef(queue);
  const lastSpawnTimeRef = useRef(0);

  const setVisibleMap = useCallback((nextVisible: Map<string, CardPosition>) => {
    visibleRef.current = nextVisible;
    setVisible(nextVisible);
  }, []);

  const setQueue = useCallback((nextQueue: QueuedCard[]) => {
    queueRef.current = nextQueue;
    setQueueState(nextQueue);
  }, []);

  const enqueue = useCallback(
    (cardId: string) => {
      const cardData = cardDataMap.get(cardId);
      if (!cardData) return;

      if (queueRef.current.some((queued) => queued.id === cardId)) return;

      setQueue([
        ...queueRef.current,
        {
          id: cardId,
          data: cardData,
          queuedAt: Date.now(),
        },
      ]);
    },
    [cardDataMap, setQueue],
  );

  const dequeue = useCallback((): QueuedCard | undefined => {
    const now = Date.now();
    if (now - lastSpawnTimeRef.current < QUEUE.SPAWN_DELAY) {
      return undefined;
    }

    const [dequeuedCard, ...remainingQueue] = queueRef.current;
    if (!dequeuedCard) return undefined;

    lastSpawnTimeRef.current = now;
    setQueue(remainingQueue);

    return dequeuedCard;
  }, [setQueue]);

  const removeVisible = useCallback(
    (cardId: string) => {
      if (!visibleRef.current.has(cardId)) return;

      const nextVisible = new Map(visibleRef.current);
      nextVisible.delete(cardId);
      setVisibleMap(nextVisible);
      enqueue(cardId);
    },
    [enqueue, setVisibleMap],
  );

  const addVisible = useCallback(
    (cardId: string, position: CardPosition) => {
      const currentVisible = visibleRef.current;
      if (currentVisible.size >= maxVisible && !currentVisible.has(cardId)) {
        return false;
      }

      const nextVisible = new Map(currentVisible);
      nextVisible.set(cardId, position);
      setVisibleMap(nextVisible);
      return true;
    },
    [maxVisible, setVisibleMap],
  );

  const reset = useCallback(() => {
    const initialVisible = calculateInitialPositions(
      filteredCards,
      Math.min(QUEUE.INITIAL_SPAWN_COUNT, maxVisible),
      rotationRange,
    );

    setVisibleMap(initialVisible);

    const visibleIds = new Set(initialVisible.keys());
    setQueue(createQueuedCards(filteredCards.filter((card) => !visibleIds.has(card.id))));
    lastSpawnTimeRef.current = 0;
  }, [filteredCards, maxVisible, rotationRange, setQueue, setVisibleMap]);

  const applyFilter = useCallback(
    (searchTerm: string, category: string | null) => {
      setFilterState({ searchTerm, category });

      const filtered = filterCards(cards, searchTerm, category);
      const nextVisible = calculateInitialPositions(
        filtered,
        Math.min(QUEUE.INITIAL_SPAWN_COUNT, maxVisible),
        rotationRange,
      );

      setVisibleMap(nextVisible);

      const visibleIds = new Set(nextVisible.keys());
      setQueue(createQueuedCards(filtered.filter((card) => !visibleIds.has(card.id))));
      lastSpawnTimeRef.current = 0;
    },
    [cards, maxVisible, rotationRange, setQueue, setVisibleMap],
  );

  return {
    visible,
    queue,
    cardDataMap,
    maxVisible,
    enqueue,
    dequeue,
    removeVisible,
    addVisible,
    reset,
    applyFilter,
  };
}
