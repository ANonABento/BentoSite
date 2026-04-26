/**
 * useSearchCardState - Search Card Edge Detection & Morph Logic
 *
 * Manages the search card's state including:
 * - Edge detection from the regular grid slot
 * - Proportional compression as that slot moves off-screen
 * - Search term and category filter
 */

import { useState, useCallback, useMemo } from 'react';
import type { Position, SearchCardState, SearchCardEdge, Camera } from '../UnifiedGrid.types';
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
  /** Toggle details open/closed */
  toggleExpanded: () => void;
  /** Set details open state directly */
  setExpanded: (expanded: boolean) => void;
  /** Update search term */
  setSearchTerm: (term: string) => void;
  /** Update category filter */
  setCategory: (category: string | null) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Position for the search card (screen coordinates) */
  screenPosition: Position;
}

interface SearchCardPresentation {
  edge: SearchCardEdge;
  compression: number;
  screenPosition: Position;
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

/**
 * Calculate the search card's display from its regular grid slot. The card
 * starts compressing only as the full 2x1 slot moves beyond a viewport edge,
 * and the compression value is proportional to that off-screen distance.
 */
export function getSearchCardPresentation(
  camera: Camera,
  windowSize: { width: number; height: number }
): SearchCardPresentation {
  const regularPosition = canvasToScreen(0, 0, camera, windowSize);
  const cardWidth = SEARCH_CARD.EXPANDED_WIDTH * camera.zoom;
  const cardHeight = SEARCH_CARD.EXPANDED_HEIGHT * camera.zoom;
  const padding = SEARCH_CARD.EDGE_PADDING;

  const cardLeft = regularPosition.x - cardWidth / 2;
  const cardRight = regularPosition.x + cardWidth / 2;
  const cardTop = regularPosition.y - cardHeight / 2;
  const cardBottom = regularPosition.y + cardHeight / 2;

  const edgeDistances: Record<Exclude<SearchCardEdge, 'none'>, number> = {
    left: Math.max(0, padding - cardLeft),
    right: Math.max(0, cardRight - (windowSize.width - padding)),
    top: Math.max(0, padding - cardTop),
    bottom: Math.max(0, cardBottom - (windowSize.height - padding)),
  };

  const [edge, offscreenDistance] = (
    Object.entries(edgeDistances) as Array<[Exclude<SearchCardEdge, 'none'>, number]>
  ).reduce<[SearchCardEdge, number]>(
    (best, [nextEdge, distance]) => (distance > best[1] ? [nextEdge, distance] : best),
    ['none', 0]
  );

  const compression = clamp(offscreenDistance / SEARCH_CARD.COMPRESSION_DISTANCE, 0, 1);
  const isSideEdge = edge === 'left' || edge === 'right';
  const isHorizontalEdge = edge === 'top' || edge === 'bottom';
  const width = isSideEdge
    ? lerp(cardWidth, SEARCH_CARD.SQUASHED_SIDE_WIDTH, compression)
    : cardWidth;
  const height = isHorizontalEdge
    ? lerp(cardHeight, SEARCH_CARD.COLLAPSED_HEIGHT, compression)
    : cardHeight;

  const minX = padding + width / 2;
  const maxX = windowSize.width - padding - width / 2;
  const minY = padding + height / 2;
  const maxY = windowSize.height - padding - height / 2;

  return {
    edge,
    compression,
    width,
    height,
    screenPosition: {
      x: compression > 0 ? clamp(regularPosition.x, minX, maxX) : regularPosition.x,
      y: compression > 0 ? clamp(regularPosition.y, minY, maxY) : regularPosition.y,
    },
  };
}

function getMobilePresentation(
  windowSize: { width: number; height: number },
  expanded: boolean
): SearchCardPresentation {
  const width = Math.min(
    windowSize.width - SEARCH_CARD.EDGE_PADDING * 2,
    SEARCH_CARD.EXPANDED_WIDTH
  );
  const height = expanded ? SEARCH_CARD.EXPANDED_HEIGHT : SEARCH_CARD.COLLAPSED_HEIGHT;

  return {
    edge: 'top',
    compression: expanded ? 0 : 1,
    width,
    height,
    screenPosition: {
      x: windowSize.width / 2,
      y: SEARCH_CARD.EDGE_PADDING + height / 2,
    },
  };
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

  const [userExpanded, setUserExpanded] = useState(true);
  const [searchTerm, setSearchTermState] = useState('');
  const [category, setCategoryState] = useState<string | null>(null);

  const presentation = useMemo(
    () => (isMobile
      ? getMobilePresentation(windowSize, userExpanded)
      : getSearchCardPresentation(camera, windowSize)),
    [camera, windowSize, isMobile, userExpanded]
  );

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
    expanded: userExpanded,
    edge: presentation.edge,
    compression: presentation.compression,
    width: presentation.width,
    height: presentation.height,
    searchTerm,
    category,
    categories,
    toggleExpanded,
    setExpanded: setUserExpanded,
    setSearchTerm,
    setCategory,
    clearFilters,
    screenPosition: presentation.screenPosition,
  };
}
