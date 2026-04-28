/**
 * useCardNavigation - Keyboard navigation for grid cards
 *
 * Features:
 * - Arrow keys move focus to nearest card in direction
 * - Tab cycles through visible cards (left-to-right, top-to-bottom)
 * - Enter/Space selects the focused card
 * - Escape clears focus
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { CardPosition, CardData } from '../UnifiedGrid.types';

// =============================================================================
// TYPES
// =============================================================================

export interface UseCardNavigationOptions {
  /** Currently visible cards with positions */
  visible: Map<string, CardPosition>;
  /** All card data for lookup */
  cards: CardData[];
  /** Callback when a card is selected */
  onSelect?: (card: CardData) => void;
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
}

export interface UseCardNavigationReturn {
  /** Currently focused card ID (null if none) */
  focusedCardId: string | null;
  /** Set focused card programmatically */
  setFocusedCardId: (id: string | null) => void;
  /** Clear focus */
  clearFocus: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SELECT_KEYS = ['Enter', ' '];
const BLUR_KEY = 'Escape';
const CYCLE_KEY = 'Tab';

// =============================================================================
// HELPERS
// =============================================================================

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

/**
 * Get center point of a card
 */
function getCardCenter(pos: CardPosition): { x: number; y: number } {
  return {
    x: pos.x + pos.width / 2,
    y: pos.y + pos.height / 2,
  };
}

/**
 * Find the nearest card in a given direction from the current position
 */
function findNearestInDirection(
  currentId: string | null,
  direction: Direction,
  visible: Map<string, CardPosition>
): string | null {
  const entries = Array.from(visible.entries());

  // If no current focus, pick the first card (top-left most)
  if (!currentId) {
    if (entries.length === 0) return null;
    // Sort by y, then x to get top-left most
    entries.sort(([, a], [, b]) => {
      const dy = a.y - b.y;
      if (Math.abs(dy) > 50) return dy;
      return a.x - b.x;
    });
    return entries[0][0];
  }

  const currentPos = visible.get(currentId);
  if (!currentPos) {
    // Current card no longer visible, pick any
    return entries.length > 0 ? entries[0][0] : null;
  }

  const currentCenter = getCardCenter(currentPos);

  // Filter cards in the specified direction
  const candidates = entries.filter(([id, pos]) => {
    if (id === currentId) return false;
    const center = getCardCenter(pos);

    switch (direction) {
      case 'up':
        return center.y < currentCenter.y - 20; // Must be above with some tolerance
      case 'down':
        return center.y > currentCenter.y + 20;
      case 'left':
        return center.x < currentCenter.x - 20;
      case 'right':
        return center.x > currentCenter.x + 20;
    }
  });

  if (candidates.length === 0) return currentId; // Stay on current

  // Sort by distance with preference for cards aligned with current
  candidates.sort(([, a], [, b]) => {
    const centerA = getCardCenter(a);
    const centerB = getCardCenter(b);

    // Calculate weighted distance favoring the primary direction
    const dxA = centerA.x - currentCenter.x;
    const dyA = centerA.y - currentCenter.y;
    const dxB = centerB.x - currentCenter.x;
    const dyB = centerB.y - currentCenter.y;

    // Weight perpendicular distance less
    let distA: number, distB: number;
    if (direction === 'up' || direction === 'down') {
      distA = Math.abs(dyA) + Math.abs(dxA) * 2;
      distB = Math.abs(dyB) + Math.abs(dxB) * 2;
    } else {
      distA = Math.abs(dxA) + Math.abs(dyA) * 2;
      distB = Math.abs(dxB) + Math.abs(dyB) * 2;
    }

    return distA - distB;
  });

  return candidates[0][0];
}

/**
 * Get cards sorted in reading order (left-to-right, top-to-bottom)
 */
function getCardsInTabOrder(visible: Map<string, CardPosition>): string[] {
  return Array.from(visible.entries())
    .sort(([, a], [, b]) => {
      // Group by rows (cards within 100px vertical are same row)
      const rowA = Math.floor(a.y / 100);
      const rowB = Math.floor(b.y / 100);
      if (rowA !== rowB) return rowA - rowB;
      return a.x - b.x;
    })
    .map(([id]) => id);
}

// =============================================================================
// HOOK
// =============================================================================

export function useCardNavigation({
  visible,
  cards,
  onSelect,
  enabled = true,
}: UseCardNavigationOptions): UseCardNavigationReturn {
  const [storedFocusedCardId, setFocusedCardId] = useState<string | null>(null);

  // Effective focus: if the stored focused card is no longer visible (e.g. it
  // scrolled off or was filtered out), treat focus as null without writing
  // state. The stored ID stays intact until the user makes a new selection.
  const focusedCardId =
    storedFocusedCardId && visible.has(storedFocusedCardId)
      ? storedFocusedCardId
      : null;

  // Build card lookup map
  const cardMap = useMemo(() => {
    const map = new Map<string, CardData>();
    cards.forEach((card) => map.set(card.id, card));
    return map;
  }, [cards]);

  // Clear focus
  const clearFocus = useCallback(() => {
    setFocusedCardId(null);
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if typing in an input (unless Escape)
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInput && e.key !== BLUR_KEY) return;

      // Handle Escape - clear focus and blur any input
      if (e.key === BLUR_KEY) {
        clearFocus();
        if (isInput && target instanceof HTMLElement) {
          target.blur();
        }
        return;
      }

      // Handle Tab - cycle through cards
      if (e.key === CYCLE_KEY) {
        e.preventDefault();
        const tabOrder = getCardsInTabOrder(visible);
        if (tabOrder.length === 0) return;

        const currentIndex = focusedCardId ? tabOrder.indexOf(focusedCardId) : -1;
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + tabOrder.length) % tabOrder.length
          : (currentIndex + 1) % tabOrder.length;

        setFocusedCardId(tabOrder[nextIndex]);
        return;
      }

      // Handle arrow keys - directional navigation
      const direction = getDirection(e.key);
      if (direction) {
        e.preventDefault();
        const nextId = findNearestInDirection(focusedCardId, direction, visible);
        if (nextId) {
          setFocusedCardId(nextId);
        }
        return;
      }

      // Handle Enter/Space - select card
      if (SELECT_KEYS.includes(e.key) && focusedCardId) {
        e.preventDefault();
        const card = cardMap.get(focusedCardId);
        if (card && onSelect) {
          onSelect(card);
        }
        return;
      }
    },
    [visible, focusedCardId, cardMap, onSelect, clearFocus]
  );

  // Attach global keyboard listener
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
