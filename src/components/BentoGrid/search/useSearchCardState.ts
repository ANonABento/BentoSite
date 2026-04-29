'use client';

import { useCallback, useMemo, useState } from 'react';
import { SEARCH_CARD } from '../BentoGrid.constants';
import type {
  Camera,
  Position,
  SearchCardEdge,
  SearchCardState,
  Size,
} from '../BentoGrid.types';
import { canvasToScreen, clamp } from '../core/useViewport';

export interface UseSearchCardStateOptions {
  camera: Camera;
  windowSize: Size;
  categories: string[];
  isMobile?: boolean;
  onFilterChange?: (searchTerm: string, category: string | null) => void;
}

export interface UseSearchCardStateReturn extends SearchCardState {
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
  setSearchTerm: (term: string) => void;
  setCategory: (category: string | null) => void;
  clearFilters: () => void;
}

export interface SearchCardPresentation {
  edge: SearchCardEdge;
  stickyEdge: SearchCardEdge;
  compression: number;
  canvasPosition: Position;
  screenPosition: Position;
  width: number;
  height: number;
  size: Size;
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

/**
 * Calculates the search card's rendered presentation from its regular 2x1
 * canvas slot. Compression is proportional to the amount that slot crosses a
 * viewport edge, so the card eases from a normal card into the sticky edge UI.
 */
export function getSearchCardPresentation(
  camera: Camera,
  windowSize: Size,
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
    ['none', 0],
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
  const screenPosition = {
    x: compression > 0 ? clamp(regularPosition.x, minX, maxX) : regularPosition.x,
    y: compression > 0 ? clamp(regularPosition.y, minY, maxY) : regularPosition.y,
  };

  return {
    edge,
    stickyEdge: edge,
    compression,
    canvasPosition: { x: 0, y: 0 },
    screenPosition,
    width,
    height,
    size: { width, height },
  };
}

function getMobilePresentation(
  windowSize: Size,
  expanded: boolean,
): SearchCardPresentation {
  const width = Math.min(
    windowSize.width - SEARCH_CARD.EDGE_PADDING * 2,
    SEARCH_CARD.EXPANDED_WIDTH,
  );
  const height = expanded ? SEARCH_CARD.EXPANDED_HEIGHT : SEARCH_CARD.COLLAPSED_HEIGHT;

  return {
    edge: 'top',
    stickyEdge: 'top',
    compression: expanded ? 0 : 1,
    canvasPosition: { x: 0, y: 0 },
    screenPosition: {
      x: windowSize.width / 2,
      y: SEARCH_CARD.EDGE_PADDING + height / 2,
    },
    width,
    height,
    size: { width, height },
  };
}

export function useSearchCardState({
  camera,
  windowSize,
  categories,
  isMobile = false,
  onFilterChange,
}: UseSearchCardStateOptions): UseSearchCardStateReturn {
  const [userExpanded, setUserExpanded] = useState(true);
  const [searchTerm, setSearchTermState] = useState('');
  const [category, setCategoryState] = useState<string | null>(null);

  const presentation = useMemo(
    () => (isMobile
      ? getMobilePresentation(windowSize, userExpanded)
      : getSearchCardPresentation(camera, windowSize)),
    [camera, isMobile, userExpanded, windowSize],
  );

  const toggleExpanded = useCallback(() => {
    setUserExpanded((expanded) => !expanded);
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
    onFilterChange?.(term, category);
  }, [category, onFilterChange]);

  const setCategory = useCallback((nextCategory: string | null) => {
    setCategoryState(nextCategory);
    onFilterChange?.(searchTerm, nextCategory);
  }, [onFilterChange, searchTerm]);

  const clearFilters = useCallback(() => {
    setSearchTermState('');
    setCategoryState(null);
    onFilterChange?.('', null);
  }, [onFilterChange]);

  return {
    expanded: userExpanded,
    edge: presentation.edge,
    stickyEdge: presentation.stickyEdge,
    compression: presentation.compression,
    canvasPosition: presentation.canvasPosition,
    screenPosition: presentation.screenPosition,
    width: presentation.width,
    height: presentation.height,
    size: presentation.size,
    searchTerm,
    category,
    categories,
    toggleExpanded,
    setExpanded: setUserExpanded,
    setSearchTerm,
    setCategory,
    clearFilters,
  };
}
