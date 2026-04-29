import type { Camera, Point, Size, StickyEdge } from '../BentoGrid.types';
import { canvasToScreen, screenToCanvas } from './useViewport';

export interface ClampResult {
  position: Point;
  edge: StickyEdge;
  isClamped: boolean;
}

function isAwayFromCenter(value: number, center: number): boolean {
  return Math.abs(value - center) > 0.5;
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

  if (minX > maxX) {
    const centerX = windowSize.width / 2;
    clampedScreenX = centerX;
    if (isAwayFromCenter(screenPosition.x, centerX)) {
      edge = screenPosition.x < centerX ? 'left' : 'right';
      isClamped = true;
    }
  } else {
    if (screenPosition.x < minX) {
      clampedScreenX = minX;
      edge = 'left';
      isClamped = true;
    } else if (screenPosition.x > maxX) {
      clampedScreenX = maxX;
      edge = 'right';
      isClamped = true;
    }
  }

  if (minY > maxY) {
    const centerY = windowSize.height / 2;
    clampedScreenY = centerY;
    if (isAwayFromCenter(screenPosition.y, centerY)) {
      if (edge === 'none') {
        edge = screenPosition.y < centerY ? 'top' : 'bottom';
      }
      isClamped = true;
    }
  } else {
    if (screenPosition.y < minY) {
      clampedScreenY = minY;
      if (edge === 'none') edge = 'top';
      isClamped = true;
    } else if (screenPosition.y > maxY) {
      clampedScreenY = maxY;
      if (edge === 'none') edge = 'bottom';
      isClamped = true;
    }
  }

  return {
    position: screenToCanvas(clampedScreenX, clampedScreenY, camera, windowSize),
    edge,
    isClamped,
  };
}
