// Tests for UnifiedGrid coordinate transforms and viewport math.
import { describe, it, expect } from 'vitest';
import {
  screenToCanvas,
  canvasToScreen,
  getCameraTransform,
} from '../core/useViewport';

const windowSize = { width: 1920, height: 1080 };

describe('screenToCanvas', () => {
  it('maps screen center to canvas origin when camera is at origin', () => {
    const result = screenToCanvas(960, 540, { x: 0, y: 0, zoom: 1 }, windowSize);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
  });

  it('subtracts camera offset', () => {
    const result = screenToCanvas(960, 540, { x: 100, y: 50, zoom: 1 }, windowSize);
    expect(result.x).toBeCloseTo(-100);
    expect(result.y).toBeCloseTo(-50);
  });

  it('accounts for zoom level', () => {
    const result = screenToCanvas(960 + 100, 540, { x: 0, y: 0, zoom: 2 }, windowSize);
    // 100 screen pixels at zoom=2 → 50 canvas units
    expect(result.x).toBeCloseTo(50);
  });
});

describe('canvasToScreen', () => {
  it('is the inverse of screenToCanvas', () => {
    const camera = { x: 123, y: -45, zoom: 1.5 };
    const screen = canvasToScreen(50, -20, camera, windowSize);
    const back = screenToCanvas(screen.x, screen.y, camera, windowSize);
    expect(back.x).toBeCloseTo(50);
    expect(back.y).toBeCloseTo(-20);
  });
});

describe('getCameraTransform', () => {
  it('produces a transform string with center, scale, and camera offset', () => {
    const t = getCameraTransform({ x: 10, y: 20, zoom: 2 }, windowSize);
    expect(t).toContain('translate(960px, 540px)');
    expect(t).toContain('scale(2)');
    expect(t).toContain('translate(10px, 20px)');
  });
});

describe('viewport bounds invariants under panning', () => {
  // The fixes in useSpawnManager assume this sign convention:
  // when camera.x increases, the viewport in canvas-space shifts LEFT
  // (its left edge becomes more negative). Lock that down with a test.
  it('left edge becomes more negative when camera.x increases', () => {
    const before = screenToCanvas(0, 0, { x: 0, y: 0, zoom: 1 }, windowSize);
    const after = screenToCanvas(0, 0, { x: 100, y: 0, zoom: 1 }, windowSize);
    expect(after.x).toBeLessThan(before.x);
  });

  it('right edge becomes more negative when camera.x increases', () => {
    const before = screenToCanvas(windowSize.width, 0, { x: 0, y: 0, zoom: 1 }, windowSize);
    const after = screenToCanvas(windowSize.width, 0, { x: 100, y: 0, zoom: 1 }, windowSize);
    expect(after.x).toBeLessThan(before.x);
  });
});
