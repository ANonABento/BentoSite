// Coordinate Transforms
// Convert between screen and canvas coordinates

import type { Point, Camera, Bounds, Size } from '../InfiniteGrid.types';

/**
 * Convert screen (pixel) coordinates to canvas coordinates
 * Screen origin is top-left, canvas origin is center of viewport
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  camera: Camera,
  windowSize: Size
): Point {
  return {
    x: (screenX - windowSize.width / 2) / camera.zoom - camera.x,
    y: (screenY - windowSize.height / 2) / camera.zoom - camera.y,
  };
}

/**
 * Convert canvas coordinates to screen (pixel) coordinates
 */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  camera: Camera,
  windowSize: Size
): Point {
  return {
    x: (canvasX + camera.x) * camera.zoom + windowSize.width / 2,
    y: (canvasY + camera.y) * camera.zoom + windowSize.height / 2,
  };
}

/**
 * Get the visible bounds in canvas coordinates
 */
export function getViewportBounds(
  camera: Camera,
  windowSize: Size,
  buffer = 0
): Bounds {
  const halfWidth = (windowSize.width / 2 + buffer) / camera.zoom;
  const halfHeight = (windowSize.height / 2 + buffer) / camera.zoom;

  return {
    x: -camera.x - halfWidth,
    y: -camera.y - halfHeight,
    width: halfWidth * 2,
    height: halfHeight * 2,
  };
}

/**
 * Check if a point is within bounds
 */
export function isPointInBounds(point: Point, bounds: Bounds): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

/**
 * Check if two bounds overlap
 */
export function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate distance between two points
 */
export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get the CSS transform for the canvas element based on camera state
 */
export function getCameraTransform(camera: Camera, windowSize: Size): string {
  // Translate to center, apply camera offset, then scale
  const translateX = windowSize.width / 2 + camera.x * camera.zoom;
  const translateY = windowSize.height / 2 + camera.y * camera.zoom;

  return `translate(${translateX}px, ${translateY}px) scale(${camera.zoom})`;
}
