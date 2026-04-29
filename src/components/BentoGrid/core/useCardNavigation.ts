'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CardData,
  CardPosition,
  UseCardNavigationReturn,
} from '../BentoGrid.types';
import { isEditableTarget } from './keyboard';

export interface UseCardNavigationOptions {
  visible: Map<string, CardPosition>;
  cards: CardData[];
  onSelect?: (card: CardData) => void;
  enabled?: boolean;
}

type Direction = 'up' | 'down' | 'left' | 'right';

function getDirection(key: string): Direction | null {
  switch (key) {
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    default:
      return null;
  }
}

function getCardCenter(position: CardPosition): { x: number; y: number } {
  return {
    x: position.x + position.width / 2,
    y: position.y + position.height / 2,
  };
}

function findNearestInDirection(
  currentId: string | null,
  direction: Direction,
  visible: Map<string, CardPosition>,
): string | null {
  const entries = Array.from(visible.entries());

  if (!currentId) {
    return entries
      .sort(([, a], [, b]) => {
        const dy = a.y - b.y;
        return Math.abs(dy) > 50 ? dy : a.x - b.x;
      })
      .at(0)?.[0] ?? null;
  }

  const currentPosition = visible.get(currentId);
  if (!currentPosition) return entries.at(0)?.[0] ?? null;

  const currentCenter = getCardCenter(currentPosition);
  const candidates = entries.filter(([id, position]) => {
    if (id === currentId) return false;

    const center = getCardCenter(position);
    switch (direction) {
      case 'up':
        return center.y < currentCenter.y - 20;
      case 'down':
        return center.y > currentCenter.y + 20;
      case 'left':
        return center.x < currentCenter.x - 20;
      case 'right':
        return center.x > currentCenter.x + 20;
    }
  });

  if (candidates.length === 0) return currentId;

  candidates.sort(([, a], [, b]) => {
    const centerA = getCardCenter(a);
    const centerB = getCardCenter(b);
    const dxA = centerA.x - currentCenter.x;
    const dyA = centerA.y - currentCenter.y;
    const dxB = centerB.x - currentCenter.x;
    const dyB = centerB.y - currentCenter.y;

    if (direction === 'up' || direction === 'down') {
      return Math.abs(dyA) + Math.abs(dxA) * 2 - (Math.abs(dyB) + Math.abs(dxB) * 2);
    }

    return Math.abs(dxA) + Math.abs(dyA) * 2 - (Math.abs(dxB) + Math.abs(dyB) * 2);
  });

  return candidates[0][0];
}

function getCardsInTabOrder(visible: Map<string, CardPosition>): string[] {
  return Array.from(visible.entries())
    .sort(([, a], [, b]) => {
      const rowA = Math.floor(a.y / 100);
      const rowB = Math.floor(b.y / 100);
      return rowA === rowB ? a.x - b.x : rowA - rowB;
    })
    .map(([id]) => id);
}

export function useCardNavigation({
  visible,
  cards,
  onSelect,
  enabled = true,
}: UseCardNavigationOptions): UseCardNavigationReturn {
  const [storedFocusedCardId, setFocusedCardId] = useState<string | null>(null);
  const focusedCardId =
    storedFocusedCardId && visible.has(storedFocusedCardId) ? storedFocusedCardId : null;

  const cardMap = useMemo(() => {
    const next = new Map<string, CardData>();
    cards.forEach((card) => next.set(card.id, card));
    return next;
  }, [cards]);

  const clearFocus = useCallback(() => {
    setFocusedCardId(null);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const editable = isEditableTarget(event.target);

      if (event.key === 'Escape') {
        clearFocus();
        if (editable && event.target instanceof HTMLElement) event.target.blur();
        return;
      }

      if (editable) return;

      if (event.key === 'Tab') {
        event.preventDefault();
        const tabOrder = getCardsInTabOrder(visible);
        if (tabOrder.length === 0) return;

        const currentIndex = focusedCardId ? tabOrder.indexOf(focusedCardId) : -1;
        const nextIndex = event.shiftKey
          ? (currentIndex - 1 + tabOrder.length) % tabOrder.length
          : (currentIndex + 1) % tabOrder.length;

        setFocusedCardId(tabOrder[nextIndex]);
        return;
      }

      const direction = getDirection(event.key);
      if (direction) {
        event.preventDefault();
        const nextId = findNearestInDirection(focusedCardId, direction, visible);
        if (nextId) setFocusedCardId(nextId);
        return;
      }

      if ((event.key === 'Enter' || event.key === ' ') && focusedCardId) {
        event.preventDefault();
        const card = cardMap.get(focusedCardId);
        if (card) onSelect?.(card);
      }
    },
    [cardMap, clearFocus, focusedCardId, onSelect, visible],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  return {
    focusedCardId,
    setFocusedCardId,
    clearFocus,
  };
}
