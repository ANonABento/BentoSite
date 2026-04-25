// Tests for the spawn-direction sign convention.
//
// The convention is non-obvious because the camera-pan model is the inverse
// of where the user is looking: dragging content right increases camera.x,
// which shifts the viewport LEFT in canvas-space. Cards should spawn on the
// side the user is exploring (= where the viewport is heading), so a positive
// dx must return 'left'. Locking this down here keeps a regression like
// "spawning happens on the side the user is moving away from" out of main.

import { describe, it, expect } from 'vitest';
import {
  getMovementDirectionFromDelta,
  MOVEMENT_THRESHOLD,
} from '../core/useSpawnManager';

describe('getMovementDirectionFromDelta', () => {
  it('returns null when both deltas are below threshold', () => {
    expect(getMovementDirectionFromDelta(0, 0)).toBeNull();
    expect(
      getMovementDirectionFromDelta(MOVEMENT_THRESHOLD - 0.1, 0),
    ).toBeNull();
  });

  it('returns "left" when camera moves right (user explores left of canvas)', () => {
    expect(getMovementDirectionFromDelta(10, 0)).toBe('left');
  });

  it('returns "right" when camera moves left (user explores right of canvas)', () => {
    expect(getMovementDirectionFromDelta(-10, 0)).toBe('right');
  });

  it('returns "top" when camera moves down (user explores top of canvas)', () => {
    expect(getMovementDirectionFromDelta(0, 10)).toBe('top');
  });

  it('returns "bottom" when camera moves up (user explores bottom of canvas)', () => {
    expect(getMovementDirectionFromDelta(0, -10)).toBe('bottom');
  });

  it('prefers the dominant axis when both are above threshold', () => {
    expect(getMovementDirectionFromDelta(20, 10)).toBe('left');
    expect(getMovementDirectionFromDelta(10, 20)).toBe('top');
    expect(getMovementDirectionFromDelta(-20, -10)).toBe('right');
    expect(getMovementDirectionFromDelta(-10, -20)).toBe('bottom');
  });

  it('respects custom threshold', () => {
    // Below custom threshold → null
    expect(getMovementDirectionFromDelta(8, 0, 10)).toBeNull();
    expect(getMovementDirectionFromDelta(11, 0, 10)).toBe('left');
  });
});
