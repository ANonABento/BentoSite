/**
 * useSearchCardState - Search Card Edge Detection & Morph Logic
 *
 * Manages the search card's state including:
 * - Edge detection (when to collapse to bar)
 * - Expand/collapse state
 * - Search term and category filter
 */

import { useState, useCallback, useMemo, useRef } from 'react';
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
  /** Whether the card should be visible */
  isVisible: boolean;
}

/**
 * Detect which edge the search card should stick to.
 * Uses hysteresis to prevent jitter: collapse at COLLAPSE_THRESHOLD,
 * but only expand back at EXPAND_THRESHOLD (larger value).
 */
function detectEdge(
  camera: Camera,
  windowSize: { width: number; height: number },
  currentEdge: SearchCardEdge
): SearchCardEdge {
  // Search card lives at canvas origin (0, 0)
  const screenPos = canvasToScreen(0, 0, camera, windowSize);

  const cardWidth = SEARCH_CARD.EXPANDED_WIDTH;
  const cardHeight = SEARCH_CARD.EXPANDED_HEIGHT;

  // Calculate card bounds in screen space
  const cardLeft = screenPos.x - cardWidth / 2;
  const cardRight = screenPos.x + cardWidth / 2;
  const cardTop = screenPos.y - cardHeight / 2;
  const cardBottom = screenPos.y + cardHeight / 2;

  // Use hysteresis: smaller threshold to collapse, larger to expand back
  const collapseThreshold = SEARCH_CARD.COLLAPSE_THRESHOLD;
  const expandThreshold = SEARCH_CARD.EXPAND_THRESHOLD;

  // When already collapsed to an edge, use larger threshold to expand
  // When centered (none), use smaller threshold to collapse
  const leftThreshold = currentEdge === 'left' ? expandThreshold : collapseThreshold;
  const rightThreshold = currentEdge === 'right' ? expandThreshold : collapseThreshold;
  const topThreshold = currentEdge === 'top' ? expandThreshold : collapseThreshold;
  const bottomThreshold = currentEdge === 'bottom' ? expandThreshold : collapseThreshold;

  // Check if card would be mostly off-screen
  if (cardRight < leftThreshold) return 'left';
  if (cardLeft > windowSize.width - rightThreshold) return 'right';
  if (cardBottom < topThreshold) return 'top';
  if (cardTop > windowSize.height - bottomThreshold) return 'bottom';

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

  // Core state
  const [expanded, setExpanded] = useState(true);
  const [searchTerm, setSearchTermState] = useState('');
  const [category, setCategoryState] = useState<string | null>(null);

  // Track previous edge in a ref for hysteresis. Updated during render,
  // no setState needed since detectedEdge is derived each render.
  const currentEdgeRef = useRef<SearchCardEdge>('none');

  // Detect edge based on camera position (with hysteresis).
  const detectedEdge = useMemo(() => {
    const next = isMobile
      ? 'top'
      : detectEdge(camera, windowSize, currentEdgeRef.current);
    currentEdgeRef.current = next;
    return next;
  }, [camera, windowSize, isMobile]);

  // Auto-collapse when transitioning from 'none' to an edge. This preserves
  // "user must tap to re-expand" UX. Applied during render (guarded by a
  // prev-value ref) to avoid setState-in-effect cascades.
  const prevEdgeRef = useRef<SearchCardEdge>('none');
  if (detectedEdge !== prevEdgeRef.current) {
    prevEdgeRef.current = detectedEdge;
    if (detectedEdge !== 'none' && expanded) {
      setExpanded(false);
    }
  }

  // Calculate screen position
  const screenPosition = useMemo(() => {
    if (detectedEdge !== 'none' || !expanded) {
      return getCollapsedPosition(
        detectedEdge === 'none' ? 'top' : detectedEdge,
        windowSize
      );
    }

    // Expanded: position at canvas origin converted to screen
    return canvasToScreen(0, 0, camera, windowSize);
  }, [detectedEdge, expanded, camera, windowSize]);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // Set search term with callback
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
    onFilterChange?.(term, category);
  }, [category, onFilterChange]);

  // Set category with callback
  const setCategory = useCallback((cat: string | null) => {
    setCategoryState(cat);
    onFilterChange?.(searchTerm, cat);
  }, [searchTerm, onFilterChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTermState('');
    setCategoryState(null);
    onFilterChange?.('', null);
  }, [onFilterChange]);

  // Determine if card is in collapsed state (edge override OR user collapsed)
  const isCollapsed = detectedEdge !== 'none' || !expanded;

  return {
    expanded: !isCollapsed,
    edge: detectedEdge,
    searchTerm,
    category,
    categories,
    toggleExpanded,
    setExpanded,
    setSearchTerm,
    setCategory,
    clearFilters,
    screenPosition,
    isVisible: true,
  };
}
