import type { Camera, Point, Size, StickyEdge } from '../BentoGrid.types';
import { canvasToScreen, screenToCanvas } from './useViewport';

export interface ClampResult {
  position: Point;
  edge: StickyEdge;
  isClamped: boolean;
}

export function clampCanvasPosition(
  canvasPosition: Point,
  cardSize: Size,
  camera: Camera,
  windowSize: Size,
  padding: number,
): ClampResult {
  const screenPosition = canvasToScreen(canvasPosition.x, canvasPosition.y, camera, windowSize);
  const halfWidth = cardSize.width / 2;
  const halfHeight = cardSize.height / 2;

  let clampedScreenX = screenPosition.x;
  let clampedScreenY = screenPosition.y;
  let edge: StickyEdge = 'none';
  let isClamped = false;

  const minX = padding + halfWidth;
  const maxX = windowSize.width - padding - halfWidth;
  const minY = padding + halfHeight;
  const maxY = windowSize.height - padding - halfHeight;

  if (screenPosition.x < minX) {
    clampedScreenX = minX;
    edge = 'left';
    isClamped = true;
  } else if (screenPosition.x > maxX) {
    clampedScreenX = maxX;
    edge = 'right';
    isClamped = true;
  }

  if (screenPosition.y < minY) {
    clampedScreenY = minY;
    if (edge === 'none') edge = 'top';
    isClamped = true;
  } else if (screenPosition.y > maxY) {
    clampedScreenY = maxY;
    if (edge === 'none') edge = 'bottom';
    isClamped = true;
  }

  return {
    position: screenToCanvas(clampedScreenX, clampedScreenY, camera, windowSize),
    edge,
    isClamped,
  };
}
