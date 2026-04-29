import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Camera,
  CardPosition,
  Position,
  SpawnEdge,
  UseViewportReturn,
  ViewportBounds,
} from '../BentoGrid.types';
import { GRID } from '../BentoGrid.constants';

export interface UseViewportOptions {
  camera: Camera;
  buffer?: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function screenToCanvas(
  screenX: number,
  screenY: number,
  camera: Camera,
  windowSize: { width: number; height: number },
): Position {
  const centerX = windowSize.width / 2;
  const centerY = windowSize.height / 2;

  return {
    x: (screenX - centerX) / camera.zoom - camera.x,
    y: (screenY - centerY) / camera.zoom - camera.y,
  };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  camera: Camera,
  windowSize: { width: number; height: number },
): Position {
  const centerX = windowSize.width / 2;
  const centerY = windowSize.height / 2;

  return {
    x: (canvasX + camera.x) * camera.zoom + centerX,
    y: (canvasY + camera.y) * camera.zoom + centerY,
  };
}

export function getCameraTransform(
  camera: Camera,
  windowSize: { width: number; height: number },
): string {
  const centerX = windowSize.width / 2;
  const centerY = windowSize.height / 2;

  return `translate(${centerX}px, ${centerY}px) scale(${camera.zoom}) translate(${camera.x}px, ${camera.y}px)`;
}

export function useWindowSize(): { width: number; height: number } {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

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

export function useViewport(options: UseViewportOptions): UseViewportReturn {
  const { camera, buffer = GRID.SPAWN_BUFFER } = options;
  const windowSize = useWindowSize();

  const bounds = useMemo((): ViewportBounds => {
    const topLeft = screenToCanvas(0, 0, camera, windowSize);
    const bottomRight = screenToCanvas(windowSize.width, windowSize.height, camera, windowSize);

    return {
      x: topLeft.x,
      y: topLeft.y,
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }, [camera, windowSize]);

  const isInViewport = useCallback(
    (position: Position, customBuffer: number = buffer): boolean =>
      position.x >= bounds.left - customBuffer &&
      position.x <= bounds.right + customBuffer &&
      position.y >= bounds.top - customBuffer &&
      position.y <= bounds.bottom + customBuffer,
    [bounds, buffer],
  );

  const isCardInViewport = useCallback(
    (card: CardPosition, customBuffer: number = buffer): boolean =>
      !(
        card.x + card.width < bounds.left - customBuffer ||
        card.x > bounds.right + customBuffer ||
        card.y + card.height < bounds.top - customBuffer ||
        card.y > bounds.bottom + customBuffer
      ),
    [bounds, buffer],
  );

  const getSpawnPosition = useCallback(
    (edge: SpawnEdge): Position => {
      const padding = GRID.CELL_SIZE;

      switch (edge) {
        case 'top':
          return {
            x: bounds.left + Math.random() * bounds.width,
            y: bounds.top - padding,
          };
        case 'bottom':
          return {
            x: bounds.left + Math.random() * bounds.width,
            y: bounds.bottom + padding,
          };
        case 'left':
          return {
            x: bounds.left - padding,
            y: bounds.top + Math.random() * bounds.height,
          };
        case 'right':
          return {
            x: bounds.right + padding,
            y: bounds.top + Math.random() * bounds.height,
          };
      }
    },
    [bounds],
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

  return {
    bounds,
    isInViewport,
    isCardInViewport,
    getSpawnPosition,
    getExitEdge,
  };
}
