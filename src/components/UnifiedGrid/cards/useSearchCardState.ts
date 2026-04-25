/**
 * useSearchCardState - Search Card Edge Detection & Morph Logic
 *
 * Manages the search card's state including:
 * - Edge detection (when to collapse to bar)
 * - Expand/collapse state
 * - Search term and category filter
 */

import { useState, useCallback, useMemo } from 'react';
import type { SearchCardState, SearchCardEdge, Camera } from '../UnifiedGrid.types';
import { SEARCH_CARD } from '../UnifiedGrid.constants';
import { canvasToScreen } from '../core/useViewport';

interface UseSearchCardStateOptions {
  /** Current camera state */
  camera: Camera;
  /** Window dimensions */
  windowSize: { width: number; height: number };
  /** Available categories from cards */
  categories: string[];
  /** Whether in mobile mode */
  isMobile?: boolean;
  /** Callback when filter changes */
  onFilterChange?: (searchTerm: string, category: string | null) => void;
}

interface UseSearchCardStateReturn extends SearchCardState {
  /** Toggle expanded/collapsed state */
  toggleExpanded: () => void;
  /** Set expanded state directly */
  setExpanded: (expanded: boolean) => void;
  /** Update search term */
  setSearchTerm: (term: string) => void;
  /** Update category filter */
  setCategory: (category: string | null) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Position for the search card (screen coordinates) */
  screenPosition: { x: number; y: number };
}

/**
 * Detect which edge the search card should stick to.
 * Uses midpoint of COLLAPSE_THRESHOLD and EXPAND_THRESHOLD to provide a
 * stable edge boundary without needing hysteresis state.
 */
function detectEdge(
  camera: Camera,
  windowSize: { width: number; height: number }
): SearchCardEdge {
  const screenPos = canvasToScreen(0, 0, camera, windowSize);

  const cardWidth = SEARCH_CARD.EXPANDED_WIDTH;
  const cardHeight = SEARCH_CARD.EXPANDED_HEIGHT;

  const cardLeft = screenPos.x - cardWidth / 2;
  const cardRight = screenPos.x + cardWidth / 2;
  const cardTop = screenPos.y - cardHeight / 2;
  const cardBottom = screenPos.y + cardHeight / 2;

  // Single boundary averaged from the old hysteresis range for stability.
  const threshold = (SEARCH_CARD.COLLAPSE_THRESHOLD + SEARCH_CARD.EXPAND_THRESHOLD) / 2;

  if (cardRight < threshold) return 'left';
  if (cardLeft > windowSize.width - threshold) return 'right';
  if (cardBottom < threshold) return 'top';
  if (cardTop > windowSize.height - threshold) return 'bottom';

  return 'none';
}

/**
 * Calculate screen position for collapsed bar
 */
function getCollapsedPosition(
  edge: SearchCardEdge,
  windowSize: { width: number; height: number }
): { x: number; y: number } {
  const padding = SEARCH_CARD.EDGE_PADDING;
  const barHeight = SEARCH_CARD.COLLAPSED_HEIGHT;

  switch (edge) {
    case 'top':
      return {
        x: windowSize.width / 2,
        y: padding + barHeight / 2,
      };
    case 'bottom':
      return {
        x: windowSize.width / 2,
        y: windowSize.height - padding - barHeight / 2,
      };
    case 'left':
      return {
        x: padding + barHeight / 2, // Rotated, so height becomes width
        y: windowSize.height / 2,
      };
    case 'right':
      return {
        x: windowSize.width - padding - barHeight / 2,
        y: windowSize.height / 2,
      };
    default:
      return { x: windowSize.width / 2, y: windowSize.height / 2 };
  }
}

export function useSearchCardState(
  options: UseSearchCardStateOptions
): UseSearchCardStateReturn {
  const {
    camera,
    windowSize,
    categories,
    isMobile = false,
    onFilterChange,
  } = options;

  // User-intent expanded state. The effective expanded state is derived below:
  // the search card is always collapsed when it reaches an edge.
  const [userExpanded, setUserExpanded] = useState(true);
  const [searchTerm, setSearchTermState] = useState('');
  const [category, setCategoryState] = useState<string | null>(null);

  // Detected edge (derived from camera). Mobile is always 'top'.
  const detectedEdge = useMemo(
    () => (isMobile ? 'top' : detectEdge(camera, windowSize)),
    [camera, windowSize, isMobile]
  );

  // When the card transitions from centered → an edge, clear the user-expand
  // intent so panning back to center keeps it collapsed until the user taps.
  // React allows setState during render for prop-derived state; it batches the
  // extra re-render and avoids a paint with stale state.
  const [prevEdge, setPrevEdge] = useState<SearchCardEdge>('none');
  if (detectedEdge !== prevEdge) {
    setPrevEdge(detectedEdge);
    if (detectedEdge !== 'none' && userExpanded) {
      setUserExpanded(false);
    }
  }

  // Effective expanded: must be user-expanded AND not pushed to an edge.
  const expanded = userExpanded && detectedEdge === 'none';

  // Calculate screen position
  const screenPosition = useMemo(() => {
    if (!expanded) {
      return getCollapsedPosition(
        detectedEdge === 'none' ? 'top' : detectedEdge,
        windowSize
      );
    }
    return canvasToScreen(0, 0, camera, windowSize);
  }, [detectedEdge, expanded, camera, windowSize]);

  const toggleExpanded = useCallback(() => {
    setUserExpanded((prev) => !prev);
  }, []);

  const setSearchTerm = useCallback(
    (term: string) => {
      setSearchTermState(term);
      onFilterChange?.(term, category);
    },
    [category, onFilterChange]
  );

  const setCategory = useCallback(
    (cat: string | null) => {
      setCategoryState(cat);
      onFilterChange?.(searchTerm, cat);
    },
    [searchTerm, onFilterChange]
  );

  const clearFilters = useCallback(() => {
    setSearchTermState('');
    setCategoryState(null);
    onFilterChange?.('', null);
  }, [onFilterChange]);

  return {
    expanded,
    edge: detectedEdge,
    searchTerm,
    category,
    categories,
    toggleExpanded,
    setExpanded: setUserExpanded,
    setSearchTerm,
    setCategory,
    clearFilters,
    screenPosition,
  };
}
