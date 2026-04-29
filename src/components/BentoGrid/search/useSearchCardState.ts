'use client';

import { useCallback, useMemo, useState } from 'react';
import type {
  Camera,
  Position,
  SearchCardEdge,
  SearchCardState,
} from '../BentoGrid.types';
import { SEARCH_CARD } from '../BentoGrid.constants';
import { canvasToScreen, clamp } from '../core/useViewport';

interface UseSearchCardStateOptions {
  camera: Camera;
  windowSize: { width: number; height: number };
  categories: string[];
  isMobile?: boolean;
  onFilterChange?: (searchTerm: string, category: string | null) => void;
}

interface UseSearchCardStateReturn extends SearchCardState {
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
  setSearchTerm: (term: string) => void;
  setCategory: (category: string | null) => void;
  clearFilters: () => void;
  screenPosition: Position;
}

interface SearchCardPresentation {
  edge: SearchCardEdge;
  compression: number;
  screenPosition: Position;
  width: number;
  height: number;
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

export function getSearchCardPresentation(
  camera: Camera,
  windowSize: { width: number; height: number },
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
  expanded: boolean,
): SearchCardPresentation {
  const width = Math.min(
    windowSize.width - SEARCH_CARD.EDGE_PADDING * 2,
    SEARCH_CARD.EXPANDED_WIDTH,
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
    setUserExpanded((previous) => !previous);
  }, []);

  const setSearchTerm = useCallback(
    (term: string) => {
      setSearchTermState(term);
      onFilterChange?.(term, category);
    },
    [category, onFilterChange],
  );

  const setCategory = useCallback(
    (nextCategory: string | null) => {
      setCategoryState(nextCategory);
      onFilterChange?.(searchTerm, nextCategory);
    },
    [onFilterChange, searchTerm],
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
