import type { SpawnEdge } from '../BentoGrid.types';

export const MOVEMENT_THRESHOLD = 5;

export function getMovementDirectionFromDelta(
  dx: number,
  dy: number,
  threshold: number = MOVEMENT_THRESHOLD,
): SpawnEdge | null {
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > threshold) return 'left';
    if (dx < -threshold) return 'right';
  } else {
    if (dy > threshold) return 'top';
    if (dy < -threshold) return 'bottom';
  }

  return null;
}
