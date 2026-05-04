/**
 * useSearchCardState - Search Card Edge Detection & Sticky Logic
 *
 * The search card lives in the canvas layer like all other cards. When the
 * camera pans and the search card's grid slot approaches a viewport edge,
 * this hook computes:
 *   - Whether the card should stick to an edge
 *   - How much to compress it
 *   - The overridden canvas position (clamped to viewport edge)
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import type { Position, SearchCardState, SearchCardEdge, Camera, CardPosition } from '../BentoGrid.types';
import { SEARCH_CARD } from '../BentoGrid.constants';
import { canvasToScreen, screenToCanvas } from '../core/useViewport';

interface UseSearchCardStateOptions {
  camera: Camera;
  windowSize: { width: number; height: number };
  categories: string[];
  /** The search card's grid position from the board visible map */
  searchCardLayout?: CardPosition;
  isMobile?: boolean;
  onFilterChange?: (searchTerm: string, category: string | null) => void;
}

interface UseSearchCardStateReturn extends SearchCardState {
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
  setSearchTerm: (term: string) => void;
  setCategory: (category: string | null) => void;
  clearFilters: () => void;
  /** Screen position for the search card (used for rendering) */
  screenPosition: Position;
  /** Overridden canvas position when sticky (null when free) */
  stickyCanvasPosition: CardPosition | null;
  /** The ghost's current effective canvas position (used for rehoming) */
  ghostCanvasPosition: { x: number; y: number } | null;
}

interface SearchCardPresentation {
  edge: SearchCardEdge;
  compression: number;
  rawOffscreenDistance: number;
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
 * Compute sticky presentation from the search card's canvas position.
 * Returns edge detection, compression, and clamped screen position.
 */
export function getSearchCardPresentation(
  canvasX: number,
  canvasY: number,
  cardWidth: number,
  cardHeight: number,
  camera: Camera,
  windowSize: { width: number; height: number },
): SearchCardPresentation {
  // Convert the card's canvas center to screen coordinates
  const screenCenter = canvasToScreen(
    canvasX + cardWidth / 2,
    canvasY + cardHeight / 2,
    camera,
    windowSize,
  );

  const scaledWidth = cardWidth * camera.zoom;
  const scaledHeight = cardHeight * camera.zoom;
  const padding = SEARCH_CARD.EDGE_PADDING;

  const cardLeft = screenCenter.x - scaledWidth / 2;
  const cardRight = screenCenter.x + scaledWidth / 2;
  const cardTop = screenCenter.y - scaledHeight / 2;
  const cardBottom = screenCenter.y + scaledHeight / 2;

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
    ? lerp(scaledWidth, SEARCH_CARD.SQUASHED_SIDE_WIDTH, compression)
    : scaledWidth;
  const height = isHorizontalEdge
    ? lerp(scaledHeight, SEARCH_CARD.COLLAPSED_HEIGHT, compression)
    : scaledHeight;

  const minX = padding + width / 2;
  const maxX = windowSize.width - padding - width / 2;
  const minY = padding + height / 2;
  const maxY = windowSize.height - padding - height / 2;

  return {
    edge,
    compression,
    rawOffscreenDistance: offscreenDistance,
    width: width / camera.zoom,
    height: height / camera.zoom,
    screenPosition: {
      x: compression > 0 ? clamp(screenCenter.x, minX, maxX) : screenCenter.x,
      y: compression > 0 ? clamp(screenCenter.y, minY, maxY) : screenCenter.y,
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
    rawOffscreenDistance: 0,
    width,
    height,
    screenPosition: {
      x: windowSize.width / 2,
      y: SEARCH_CARD.EDGE_PADDING + height / 2,
    },
  };
}

export function useSearchCardState(
  options: UseSearchCardStateOptions,
): UseSearchCardStateReturn {
  const {
    camera,
    windowSize,
    categories,
    searchCardLayout,
    isMobile = false,
    onFilterChange,
  } = options;

  const [userExpanded, setUserExpanded] = useState(true);
  const [searchTerm, setSearchTermState] = useState('');
  const [category, setCategoryState] = useState<string | null>(null);

  // Ghost position tracking: the search card's effective canvas position.
  // When the grid home is on-screen, the ghost matches it. When off-screen,
  // the ghost tracks viewportEdge - COMPRESSION_DISTANCE so compression stays
  // in the 0..1 range and decompression happens immediately on pan-back.
  const ghostPosRef = useRef<{ x: number; y: number } | null>(null);

  /* eslint-disable react-hooks/refs -- ghost tracking requires synchronous ref read/write */
  const effectivePresentation = useMemo(() => {
    if (isMobile) return getMobilePresentation(windowSize, userExpanded);
    if (!searchCardLayout) {
      ghostPosRef.current = null;
      return {
        edge: 'none' as SearchCardEdge,
        compression: 0,
        rawOffscreenDistance: 0,
        width: SEARCH_CARD.EXPANDED_WIDTH,
        height: SEARCH_CARD.EXPANDED_HEIGHT,
        screenPosition: { x: windowSize.width / 2, y: windowSize.height / 2 },
      };
    }

    const w = searchCardLayout.width;
    const h = searchCardLayout.height;
    const padding = SEARCH_CARD.EDGE_PADDING;
    const compDist = SEARCH_CARD.COMPRESSION_DISTANCE;

    // Use the ghost's previous position (or grid home if no ghost yet) to
    // check if the card is on-screen. This is critical — using the grid home
    // (which can be far away) would keep the card permanently compressed.
    const prevGhost = ghostPosRef.current ?? { x: searchCardLayout.x, y: searchCardLayout.y };
    const checkScreen = canvasToScreen(
      prevGhost.x + w / 2,
      prevGhost.y + h / 2,
      camera,
      windowSize,
    );
    const scaledW = w * camera.zoom;
    const scaledH = h * camera.zoom;

    const checkLeft = checkScreen.x - scaledW / 2;
    const checkRight = checkScreen.x + scaledW / 2;
    const checkTop = checkScreen.y - scaledH / 2;
    const checkBottom = checkScreen.y + scaledH / 2;

    const offLeft = Math.max(0, padding - checkLeft);
    const offRight = Math.max(0, checkRight - (windowSize.width - padding));
    const offTop = Math.max(0, padding - checkTop);
    const offBottom = Math.max(0, checkBottom - (windowSize.height - padding));

    const isOnScreen = offLeft === 0 && offRight === 0 && offTop === 0 && offBottom === 0;


    if (isOnScreen) {
      // Ghost matches grid home — no compression
      ghostPosRef.current = { x: searchCardLayout.x, y: searchCardLayout.y };
    } else {
      // Ghost stays at a fixed canvas position near the viewport edge.
      // It only moves DEEPER off-screen (when the user pans further away)
      // but stays put when panning back. This way the viewport moves
      // toward the ghost on pan-back, reducing compression immediately.
      // Ghost tracks just outside the viewport edge. Key behavior:
      // - Going off left: ghost.x = max(prevGhost.x, edgePos) — stays put
      //   when panning further, viewport approaches when panning back
      // - The "max" ensures the ghost is always as close to the viewport
      //   as possible (edgePos is just outside the viewport edge)
      let ghostX = prevGhost.x;
      let ghostY = prevGhost.y;

      if (offLeft > 0) {
        const edgeCanvasX = screenToCanvas(padding + scaledW / 2, 0, camera, windowSize).x - w / 2;
        const edgePos = edgeCanvasX - compDist / camera.zoom;
        // Ghost should be as close to viewport as possible (higher X = closer)
        ghostX = Math.max(ghostX, edgePos);
      } else if (offRight > 0) {
        const edgeCanvasX = screenToCanvas(windowSize.width - padding - scaledW / 2, 0, camera, windowSize).x - w / 2;
        const edgePos = edgeCanvasX + compDist / camera.zoom;
        ghostX = Math.min(ghostX, edgePos);
      }

      if (offTop > 0) {
        const edgeCanvasY = screenToCanvas(0, padding + scaledH / 2, camera, windowSize).y - h / 2;
        const edgePos = edgeCanvasY - compDist / camera.zoom;
        ghostY = Math.max(ghostY, edgePos);
      } else if (offBottom > 0) {
        const edgeCanvasY = screenToCanvas(0, windowSize.height - padding - scaledH / 2, camera, windowSize).y - h / 2;
        const edgePos = edgeCanvasY + compDist / camera.zoom;
        ghostY = Math.min(ghostY, edgePos);
      }

      ghostPosRef.current = { x: ghostX, y: ghostY };
    }

    return getSearchCardPresentation(
      ghostPosRef.current.x,
      ghostPosRef.current.y,
      w, h, camera, windowSize,
    );
  }, [camera, windowSize, isMobile, userExpanded, searchCardLayout]);
  /* eslint-enable react-hooks/refs */

  // Sticky canvas position: use the ghost's effective position
  /* eslint-disable react-hooks/refs -- reading ghost ref for sticky canvas pos */
  const stickyCanvasPosition = useMemo((): CardPosition | null => {
    if (effectivePresentation.compression === 0 || !searchCardLayout || !ghostPosRef.current) return null;

    return {
      x: ghostPosRef.current.x,
      y: ghostPosRef.current.y,
      width: effectivePresentation.width,
      height: effectivePresentation.height,
      size: searchCardLayout.size,
      rotation: 0,
    };
  }, [effectivePresentation, searchCardLayout]);
  /* eslint-enable react-hooks/refs */

  const toggleExpanded = useCallback(() => {
    setUserExpanded((prev) => !prev);
  }, []);

  const setSearchTerm = useCallback(
    (term: string) => {
      setSearchTermState(term);
      onFilterChange?.(term, category);
    },
    [category, onFilterChange],
  );

  const setCategory = useCallback(
    (cat: string | null) => {
      setCategoryState(cat);
      onFilterChange?.(searchTerm, cat);
    },
    [searchTerm, onFilterChange],
  );

  const clearFilters = useCallback(() => {
    setSearchTermState('');
    setCategoryState(null);
    onFilterChange?.('', null);
  }, [onFilterChange]);

  /* eslint-disable react-hooks/refs -- effectivePresentation and stickyCanvasPosition use ref tracking */
  return {
    expanded: userExpanded,
    edge: effectivePresentation.edge,
    compression: effectivePresentation.compression,
    width: effectivePresentation.width,
    height: effectivePresentation.height,
    searchTerm,
    category,
    categories,
    toggleExpanded,
    setExpanded: setUserExpanded,
    setSearchTerm,
    setCategory,
    clearFilters,
    screenPosition: effectivePresentation.screenPosition,
    stickyCanvasPosition,
    ghostCanvasPosition: ghostPosRef.current,
  };
  /* eslint-enable react-hooks/refs */
}
