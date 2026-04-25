/**
 * useViewport - Viewport Tracking for Infinite Grid
 *
 * Tracks the visible area in canvas coordinates and provides
 * utilities for checking card visibility and spawn positions.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  ViewportBounds,
  Position,
  CardPosition,
  SpawnEdge,
  Camera,
  UseViewportReturn,
} from '../UnifiedGrid.types';
import { GRID } from '../UnifiedGrid.constants';

interface UseViewportOptions {
  /** Current camera state */
  camera: Camera;
  /** Buffer zone for spawn/despawn detection */
  buffer?: number;
}

/**
 * Convert screen coordinates to canvas coordinates
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  camera: Camera,
  windowSize: { width: number; height: number }
): Position {
  const centerX = windowSize.width / 2;
  const centerY = windowSize.height / 2;

  return {
    x: (screenX - centerX) / camera.zoom - camera.x,
    y: (screenY - centerY) / camera.zoom - camera.y,
  };
}

/**
 * Convert canvas coordinates to screen coordinates
 */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  camera: Camera,
  windowSize: { width: number; height: number }
): Position {
  const centerX = windowSize.width / 2;
  const centerY = windowSize.height / 2;

  return {
    x: (canvasX + camera.x) * camera.zoom + centerX,
    y: (canvasY + camera.y) * camera.zoom + centerY,
  };
}

/**
 * Get the CSS transform for the canvas container
 */
export function getCameraTransform(
  camera: Camera,
  windowSize: { width: number; height: number }
): string {
  const centerX = windowSize.width / 2;
  const centerY = windowSize.height / 2;

  return `translate(${centerX}px, ${centerY}px) scale(${camera.zoom}) translate(${camera.x}px, ${camera.y}px)`;
}

export function useViewport(options: UseViewportOptions): UseViewportReturn {
  const { camera, buffer = GRID.SPAWN_BUFFER } = options;

  // Track window size
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Calculate viewport bounds in canvas coordinates
   */
  const bounds = useMemo((): ViewportBounds => {
    // Viewport corners in screen space
    const topLeft = screenToCanvas(0, 0, camera, windowSize);
    const bottomRight = screenToCanvas(windowSize.width, windowSize.height, camera, windowSize);

    return {
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }, [camera, windowSize]);

  /**
   * Check if a position is within the viewport (with optional buffer)
   */
  const isInViewport = useCallback(
    (position: Position, customBuffer: number = buffer): boolean => {
      return (
        position.x >= bounds.left - customBuffer &&
        position.x <= bounds.right + customBuffer &&
        position.y >= bounds.top - customBuffer &&
        position.y <= bounds.bottom + customBuffer
      );
    },
    [bounds, buffer]
  );

  /**
   * Check if a card rectangle is within the viewport
   */
  const isCardInViewport = useCallback(
    (card: CardPosition, customBuffer: number = buffer): boolean => {
      const cardLeft = card.x;
      const cardTop = card.y;
      const cardRight = card.x + card.width;
      const cardBottom = card.y + card.height;

      // Card is in viewport if any part overlaps
      return !(
        cardRight < bounds.left - customBuffer ||
        cardLeft > bounds.right + customBuffer ||
        cardBottom < bounds.top - customBuffer ||
        cardTop > bounds.bottom + customBuffer
      );
    },
    [bounds, buffer]
  );

  /**
   * Get a random spawn position along an edge
   */
  const getSpawnPosition = useCallback(
    (edge: SpawnEdge): Position => {
      const padding = GRID.CELL_SIZE; // Spawn just outside viewport

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
    [bounds]
  );

  /**
   * Determine which edge a position exited from
   */
  const getExitEdge = useCallback(
    (position: Position): SpawnEdge | null => {
      const despawnBuffer = GRID.DESPAWN_BUFFER;

      if (position.x < bounds.left - despawnBuffer) return 'left';
      if (position.x > bounds.right + despawnBuffer) return 'right';
      if (position.y < bounds.top - despawnBuffer) return 'top';
      if (position.y > bounds.bottom + despawnBuffer) return 'bottom';

      return null;
    },
    [bounds]
  );

  return {
    bounds,
    isInViewport,
    isCardInViewport,
    getSpawnPosition,
    getExitEdge,
  };
}

/**
 * Hook to get current window size with SSR safety
 */
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
