/**
 * Collision detection utilities - AABB math helpers
 */

import { CardPosition } from '../BentoHub.types';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Check if two boxes overlap (AABB collision)
 */
export function boxesOverlap(a: Box, b: Box, padding: number = 0): boolean {
  return (
    a.x - padding < b.x + b.width + padding &&
    a.x + a.width + padding > b.x - padding &&
    a.y - padding < b.y + b.height + padding &&
    a.y + a.height + padding > b.y - padding
  );
}

/**
 * Calculate overlap amount and push direction between two boxes
 */
export function getOverlapInfo(
  a: Box,
  b: Box,
  padding: number = 0
): { overlap: number; direction: Vector2 } | null {
  // Calculate overlap on each axis
  const overlapX = Math.min(
    a.x + a.width + padding - (b.x - padding),
    b.x + b.width + padding - (a.x - padding)
  );
  const overlapY = Math.min(
    a.y + a.height + padding - (b.y - padding),
    b.y + b.height + padding - (a.y - padding)
  );

  // No overlap
  if (overlapX <= 0 || overlapY <= 0) {
    return null;
  }

  // Get centers
  const centerA = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
  const centerB = { x: b.x + b.width / 2, y: b.y + b.height / 2 };

  // Direction from B to A (push A away from B)
  const dx = centerA.x - centerB.x;
  const dy = centerA.y - centerB.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  return {
    overlap: Math.min(overlapX, overlapY),
    direction: { x: dx / dist, y: dy / dist },
  };
}

/**
 * Calculate distance between two points
 */
export function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize a vector
 */
export function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

/**
 * Get center point of a box
 */
export function getCenter(box: Box): Vector2 {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

/**
 * Calculate box from home position + offset
 */
export function getOffsetBox(
  home: CardPosition,
  offset: Vector2
): Box {
  return {
    x: home.x + offset.x,
    y: home.y + offset.y,
    width: home.width,
    height: home.height,
  };
}
