/**
 * Viewport and coordinate transforms for BentoGrid.
 *
 * Coordinate convention:
 * - Screen coordinates are viewport pixels with origin at the top-left.
 * - Canvas coordinates are world units with origin at the viewport center when
 *   the camera is at { x: 0, y: 0, zoom: 1 }.
 * - Positive camera x/y moves the rendered canvas right/down, so the visible
 *   canvas bounds move left/up.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Bounds,
  Camera,
  CardPosition,
  Point,
  Position,
  Rect,
  Size,
  SpawnEdge,
  UseViewportReturn,
  ViewportBounds,
} from '../BentoGrid.types';
import { GRID } from '../BentoGrid.constants';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  return Math.sqrt(dx * dx + dy * dy);
}

export function screenToCanvas(
  screenX: number,
  screenY: number,
  camera: Camera,
  windowSize: Size,
): Position {
  return {
    x: (screenX - windowSize.width / 2) / camera.zoom - camera.x,
    y: (screenY - windowSize.height / 2) / camera.zoom - camera.y,
  };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  camera: Camera,
  windowSize: Size,
): Position {
  return {
    x: (canvasX + camera.x) * camera.zoom + windowSize.width / 2,
    y: (canvasY + camera.y) * camera.zoom + windowSize.height / 2,
  };
}

export function getViewportBounds(
  camera: Camera,
  windowSize: Size,
  buffer = 0,
): ViewportBounds {
  const topLeft = screenToCanvas(-buffer, -buffer, camera, windowSize);
  const bottomRight = screenToCanvas(
    windowSize.width + buffer,
    windowSize.height + buffer,
    camera,
    windowSize,
  );

  return {
    left: topLeft.x,
    top: topLeft.y,
    right: bottomRight.x,
    bottom: bottomRight.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

export function viewportBoundsToRect(bounds: ViewportBounds): Bounds {
  return {
    x: bounds.left,
    y: bounds.top,
    width: bounds.width,
    height: bounds.height,
  };
}

export function isPointInBounds(point: Point, bounds: Bounds | ViewportBounds): boolean {
  if ('left' in bounds) {
    return (
      point.x >= bounds.left &&
      point.x <= bounds.right &&
      point.y >= bounds.top &&
      point.y <= bounds.bottom
    );
  }

  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

export function boundsOverlap(a: Rect | Bounds, b: Rect | Bounds): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

export function getCameraTransform(camera: Camera, windowSize: Size): string {
  return `translate(${windowSize.width / 2}px, ${windowSize.height / 2}px) scale(${camera.zoom}) translate(${camera.x}px, ${camera.y}px)`;
}

export function getSpawnPositionForBounds(
  bounds: ViewportBounds,
  edge: SpawnEdge,
  padding: number = GRID.CELL_SIZE,
  getRandom: () => number = Math.random,
): Position {
  switch (edge) {
    case 'top':
      return {
        x: bounds.left + getRandom() * bounds.width,
        y: bounds.top - padding,
      };
    case 'bottom':
      return {
        x: bounds.left + getRandom() * bounds.width,
        y: bounds.bottom + padding,
      };
    case 'left':
      return {
        x: bounds.left - padding,
        y: bounds.top + getRandom() * bounds.height,
      };
    case 'right':
      return {
        x: bounds.right + padding,
        y: bounds.top + getRandom() * bounds.height,
      };
  }
}

function getInitialWindowSize(): Size {
  if (typeof window === 'undefined') {
    return { width: 1920, height: 1080 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

interface UseViewportOptions {
  camera: Camera;
  buffer?: number;
  spawnPadding?: number;
  getRandom?: () => number;
}

export function useWindowSize(): Size {
  const [size, setSize] = useState<Size>(getInitialWindowSize);

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

export function useViewport({
  camera,
  buffer = GRID.SPAWN_BUFFER,
  spawnPadding = GRID.CELL_SIZE,
  getRandom = Math.random,
}: UseViewportOptions): UseViewportReturn {
  const windowSize = useWindowSize();

  const bounds = useMemo(
    () => getViewportBounds(camera, windowSize),
    [camera, windowSize],
  );

  const isInViewport = useCallback(
    (position: Position, customBuffer: number = buffer): boolean => (
      position.x >= bounds.left - customBuffer &&
      position.x <= bounds.right + customBuffer &&
      position.y >= bounds.top - customBuffer &&
      position.y <= bounds.bottom + customBuffer
    ),
    [bounds, buffer],
  );

  const isCardInViewport = useCallback(
    (card: CardPosition | Rect, customBuffer: number = buffer): boolean => {
      const cardBounds: Rect = {
        x: card.x,
        y: card.y,
        width: card.width,
        height: card.height,
      };
      const bufferedBounds: Rect = {
        x: bounds.left - customBuffer,
        y: bounds.top - customBuffer,
        width: bounds.width + customBuffer * 2,
        height: bounds.height + customBuffer * 2,
      };

      return boundsOverlap(cardBounds, bufferedBounds);
    },
    [bounds, buffer],
  );

  const getSpawnPosition = useCallback(
    (edge: SpawnEdge): Position => getSpawnPositionForBounds(bounds, edge, spawnPadding, getRandom),
    [bounds, getRandom, spawnPadding],
  );

  const getExitEdge = useCallback(
    (position: Position): SpawnEdge | null => {
      if (position.x < bounds.left - GRID.DESPAWN_BUFFER) return 'left';
      if (position.x > bounds.right + GRID.DESPAWN_BUFFER) return 'right';
      if (position.y < bounds.top - GRID.DESPAWN_BUFFER) return 'top';
      if (position.y > bounds.bottom + GRID.DESPAWN_BUFFER) return 'bottom';

      return null;
    },
    [bounds],
  );

  const screenToCanvasForCamera = useCallback(
    (screenX: number, screenY: number) => screenToCanvas(screenX, screenY, camera, windowSize),
    [camera, windowSize],
  );

  const canvasToScreenForCamera = useCallback(
    (canvasX: number, canvasY: number) => canvasToScreen(canvasX, canvasY, camera, windowSize),
    [camera, windowSize],
  );

  return {
    bounds,
    windowSize,
    isInViewport,
    isCardInViewport,
    getSpawnPosition,
    getExitEdge,
    screenToCanvas: screenToCanvasForCamera,
    canvasToScreen: canvasToScreenForCamera,
  };
}
