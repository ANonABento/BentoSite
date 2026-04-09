// Clamp canvas position to keep card visible on screen
// Used to make SearchCard "stick" to edges without becoming an overlay

import type { Point, Size, Camera, StickyEdge } from '../InfiniteGrid.types';
import { canvasToScreen, screenToCanvas } from './transforms';

export interface ClampResult {
  /** Clamped canvas position */
  position: Point;
  /** Which edge the card is stuck to, if any */
  edge: StickyEdge;
  /** Whether the position was clamped */
  isClamped: boolean;
}

/**
 * Clamp a canvas position so the card stays visible on screen.
 *
 * When panning would push the card off-screen, this calculates what
 * canvas position keeps it visible (with padding from the edge).
 *
 * The returned canvas position can be used directly for rendering
 * and should be synced to the physics body.
 */
export function clampCanvasPosition(
  canvasPos: Point,
  cardSize: Size,
  camera: Camera,
  windowSize: Size,
  padding: number
): ClampResult {
  // Calculate where card would appear on screen
  const screenPos = canvasToScreen(canvasPos.x, canvasPos.y, camera, windowSize);

  const halfW = cardSize.width / 2;
  const halfH = cardSize.height / 2;

  let clampedScreenX = screenPos.x;
  let clampedScreenY = screenPos.y;
  let edge: StickyEdge = 'none';
  let isClamped = false;

  // Clamp X (left/right edges)
  const minX = padding + halfW;
  const maxX = windowSize.width - padding - halfW;

  if (screenPos.x < minX) {
    clampedScreenX = minX;
    edge = 'left';
    isClamped = true;
  } else if (screenPos.x > maxX) {
    clampedScreenX = maxX;
    edge = 'right';
    isClamped = true;
  }

  // Clamp Y (top/bottom edges)
  const minY = padding + halfH;
  const maxY = windowSize.height - padding - halfH;

  if (screenPos.y < minY) {
    clampedScreenY = minY;
    if (edge === 'none') edge = 'top';
    isClamped = true;
  } else if (screenPos.y > maxY) {
    clampedScreenY = maxY;
    if (edge === 'none') edge = 'bottom';
    isClamped = true;
  }

  // Convert clamped screen position back to canvas coords
  const clampedCanvas = screenToCanvas(
    clampedScreenX,
    clampedScreenY,
    camera,
    windowSize
  );

  return {
    position: clampedCanvas,
    edge,
    isClamped,
  };
}
