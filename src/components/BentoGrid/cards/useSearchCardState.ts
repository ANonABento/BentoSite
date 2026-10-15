/**
 * useSearchCardState - Search Card Edge Compression
 *
 * The search card renders as a position:fixed overlay in screen space
 * (DesktopCardLayer skips SEARCH_CARD_ID). When the camera pans so the
 * card's grid slot nears a viewport edge, this hook computes:
 *   - Which edge is closest and the compression ratio (0 = free, 1 = fully squashed)
 *   - The screen-space position for rendering the fixed overlay, clamped to that edge
 *
 * Its shape squeezes on each axis separately: past a side it narrows to a
 * tab, past the top or bottom it folds to the input row, and in a corner it
 * becomes the tab, so it morphs continuously as the camera moves between edges.
 *
 * While the slot is off screen the card stays stuck to the edge. It comes
 * free when its slot is back in view, or when DesktopCanvasView docks it in
 * another copy of the board that is.
 */

import { useState, useCallback, useMemo } from 'react';
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
  squeeze: SearchCardPresentation['squeeze'];
  side: SearchCardPresentation['side'];
  slotCenter: Position;
  /** Overridden canvas position when compressed (null when free) */
  stickyCanvasPosition: CardPosition | null;
}

interface SearchCardPresentation {
  edge: SearchCardEdge;
  compression: number;
  rawOffscreenDistance: number;
  /** How squeezed the card is by a side edge (x) and by the top or bottom (y), 0–1. */
  squeeze: { x: number; y: number };
  /** The side it's pressed against, if any; a drawer opens from there. */
  side: 'left' | 'right' | null;
  /** Where its slot is on screen, before it's held inside the edges. */
  slotCenter: Position;
  screenPosition: Position;
  /** CSS pixel dimensions for the fixed overlay. */
  width: number;
  height: number;
  /** Canvas dimensions for collision/navigation layout while sticky. */
  canvasWidth: number;
  canvasHeight: number;
}

function clamp(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

/**
 * The card's screen size for a given squeeze on each axis. Squeezes outside
 * 0–1 (a spring overshooting) bulge or pinch it a little past either end.
 */
export function searchCardShape(squeezeX: number, squeezeY: number, fullWidth: number, fullHeight: number) {
  return {
    width: lerp(fullWidth, SEARCH_CARD.SQUASHED_SIDE_WIDTH, squeezeX),
    // Folded by the top or bottom first, then pressed by a side into a tab:
    // in a corner it's the tab, whichever edge it came from.
    height: lerp(lerp(fullHeight, SEARCH_CARD.COLLAPSED_HEIGHT, squeezeY), SEARCH_CARD.SQUASHED_SIDE_HEIGHT, squeezeX),
  };
}

/** Holds a card of this size inside the screen's padding, pressed against whichever edge its slot is past. */
export function holdInsideEdges(slotCenter: Position, width: number, height: number, windowSize: { width: number; height: number }): Position {
  const padding = SEARCH_CARD.EDGE_PADDING;
  return {
    x: clamp(slotCenter.x, padding + width / 2, windowSize.width - padding - width / 2),
    y: clamp(slotCenter.y, padding + height / 2, windowSize.height - padding - height / 2),
  };
}

/**
 * Compute sticky presentation from the search card's canvas position.
 * Returns edge detection, compression, and clamped screen position.
 */
/** How much further past a new edge the card must go, near a corner, before it switches edge. */
const EDGE_SWITCH_MARGIN = 48;

export function getSearchCardPresentation(
  canvasX: number,
  canvasY: number,
  cardWidth: number,
  cardHeight: number,
  camera: Camera,
  windowSize: { width: number; height: number },
  /** The edge it was stuck to last frame; it keeps that edge in a corner until another clearly wins. */
  previousEdge: SearchCardEdge = 'none',
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

  let [edge, offscreenDistance] = (
    Object.entries(edgeDistances) as Array<[Exclude<SearchCardEdge, 'none'>, number]>
  ).reduce<[SearchCardEdge, number]>(
    (best, [nextEdge, distance]) => (distance > best[1] ? [nextEdge, distance] : best),
    ['none', 0],
  );
  if (previousEdge !== 'none' && edge !== previousEdge) {
    const kept = edgeDistances[previousEdge];
    if (kept > 0 && offscreenDistance - kept < EDGE_SWITCH_MARGIN) {
      edge = previousEdge;
      offscreenDistance = kept;
    }
  }

  const compression = clamp(offscreenDistance / SEARCH_CARD.COMPRESSION_DISTANCE, 0, 1);
  const sideDistance = Math.max(edgeDistances.left, edgeDistances.right);
  const squeeze = {
    x: clamp(sideDistance / SEARCH_CARD.COMPRESSION_DISTANCE, 0, 1),
    y: clamp(Math.max(edgeDistances.top, edgeDistances.bottom) / SEARCH_CARD.COMPRESSION_DISTANCE, 0, 1),
  };
  const { width, height } = searchCardShape(squeeze.x, squeeze.y, scaledWidth, scaledHeight);

  return {
    edge,
    compression,
    rawOffscreenDistance: offscreenDistance,
    squeeze,
    side: sideDistance > 0 ? (edgeDistances.left > edgeDistances.right ? 'left' : 'right') : null,
    slotCenter: screenCenter,
    width,
    height,
    canvasWidth: width / camera.zoom,
    canvasHeight: height / camera.zoom,
    screenPosition: compression > 0 ? holdInsideEdges(screenCenter, width, height, windowSize) : screenCenter,
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
    squeeze: { x: 0, y: expanded ? 0 : 1 },
    side: null,
    slotCenter: { x: windowSize.width / 2, y: SEARCH_CARD.EDGE_PADDING + height / 2 },
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
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

  // On a phone the card starts as just the search row; the chevron opens the categories.
  const [userExpanded, setUserExpanded] = useState(!isMobile);
  const [lastEdge, setLastEdge] = useState<SearchCardEdge>('none');
  const [searchTerm, setSearchTermState] = useState('');
  const [category, setCategoryState] = useState<string | null>(null);

  const effectivePresentation = useMemo(() => {
    if (isMobile) return getMobilePresentation(windowSize, userExpanded);
    if (!searchCardLayout) {
      return {
        edge: 'none' as SearchCardEdge,
        compression: 0,
        rawOffscreenDistance: 0,
        squeeze: { x: 0, y: 0 },
        side: null,
        slotCenter: { x: windowSize.width / 2, y: windowSize.height / 2 },
        width: SEARCH_CARD.EXPANDED_WIDTH,
        height: SEARCH_CARD.EXPANDED_HEIGHT,
        canvasWidth: SEARCH_CARD.EXPANDED_WIDTH,
        canvasHeight: SEARCH_CARD.EXPANDED_HEIGHT,
        screenPosition: { x: windowSize.width / 2, y: windowSize.height / 2 },
      };
    }
    // The card sticks to whichever edge its slot left by, until the slot (or
    // another copy's dock, see useTiledBoard) is back on screen.
    return getSearchCardPresentation(
      searchCardLayout.x,
      searchCardLayout.y,
      searchCardLayout.width,
      searchCardLayout.height,
      camera,
      windowSize,
      lastEdge,
    );
  }, [camera, windowSize, isMobile, userExpanded, searchCardLayout, lastEdge]);
  // Remember the edge for next frame's corner check (settled during render).
  if (effectivePresentation.edge !== lastEdge) setLastEdge(effectivePresentation.edge);

  const stickyCanvasPosition = useMemo((): CardPosition | null => {
    if (effectivePresentation.compression === 0 || !searchCardLayout) return null;
    const { screenPosition, width, height } = effectivePresentation;
    const topLeft = screenToCanvas(screenPosition.x - width / 2, screenPosition.y - height / 2, camera, windowSize);

    return {
      ...topLeft,
      width: effectivePresentation.canvasWidth,
      height: effectivePresentation.canvasHeight,
      size: searchCardLayout.size,
      rotation: 0,
    };
  }, [effectivePresentation, searchCardLayout, camera, windowSize]);

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

  return {
    expanded: userExpanded,
    edge: effectivePresentation.edge,
    compression: effectivePresentation.compression,
    squeeze: effectivePresentation.squeeze,
    side: effectivePresentation.side,
    slotCenter: effectivePresentation.slotCenter,
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
  };
}
