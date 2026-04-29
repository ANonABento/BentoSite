import { describe, expect, it } from 'vitest';
import {
  getMovementDirectionFromDelta,
  MOVEMENT_THRESHOLD,
} from '../core/useSpawnManager';

describe('BentoGrid getMovementDirectionFromDelta', () => {
  it('returns null when both deltas are below threshold', () => {
    expect(getMovementDirectionFromDelta(0, 0)).toBeNull();
    expect(getMovementDirectionFromDelta(MOVEMENT_THRESHOLD - 0.1, 0)).toBeNull();
  });

  it('returns the edge the camera is exploring toward', () => {
    expect(getMovementDirectionFromDelta(10, 0)).toBe('left');
    expect(getMovementDirectionFromDelta(-10, 0)).toBe('right');
    expect(getMovementDirectionFromDelta(0, 10)).toBe('top');
    expect(getMovementDirectionFromDelta(0, -10)).toBe('bottom');
  });

  it('prefers the dominant axis', () => {
    expect(getMovementDirectionFromDelta(20, 10)).toBe('left');
    expect(getMovementDirectionFromDelta(10, 20)).toBe('top');
  });
});
