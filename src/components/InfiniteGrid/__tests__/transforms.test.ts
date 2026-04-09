// Tests for coordinate transforms
import { describe, it, expect } from 'vitest';
import {
  screenToCanvas,
  canvasToScreen,
  getViewportBounds,
  isPointInBounds,
  boundsOverlap,
  clamp,
  distance,
} from '../canvas/transforms';

describe('screenToCanvas', () => {
  const windowSize = { width: 1920, height: 1080 };

  it('converts screen center to canvas origin when camera is at origin', () => {
    const camera = { x: 0, y: 0, zoom: 1 };
    const result = screenToCanvas(960, 540, camera, windowSize);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
  });

  it('accounts for camera offset', () => {
    const camera = { x: 100, y: 50, zoom: 1 };
    const result = screenToCanvas(960, 540, camera, windowSize);
    expect(result.x).toBeCloseTo(-100);
    expect(result.y).toBeCloseTo(-50);
  });

  it('accounts for zoom level', () => {
    const camera = { x: 0, y: 0, zoom: 2 };
    // At 2x zoom, screen offset of 100 pixels = 50 canvas units
    const result = screenToCanvas(960 + 100, 540, camera, windowSize);
    expect(result.x).toBeCloseTo(50);
    expect(result.y).toBeCloseTo(0);
  });
});

describe('canvasToScreen', () => {
  const windowSize = { width: 1920, height: 1080 };

  it('converts canvas origin to screen center when camera is at origin', () => {
    const camera = { x: 0, y: 0, zoom: 1 };
    const result = canvasToScreen(0, 0, camera, windowSize);
    expect(result.x).toBeCloseTo(960);
    expect(result.y).toBeCloseTo(540);
  });

  it('accounts for camera offset', () => {
    const camera = { x: 100, y: 50, zoom: 1 };
    const result = canvasToScreen(0, 0, camera, windowSize);
    expect(result.x).toBeCloseTo(1060);
    expect(result.y).toBeCloseTo(590);
  });

  it('accounts for zoom level', () => {
    const camera = { x: 0, y: 0, zoom: 2 };
    // At 2x zoom, canvas offset of 50 = 100 screen pixels
    const result = canvasToScreen(50, 0, camera, windowSize);
    expect(result.x).toBeCloseTo(1060);
  });

  it('is inverse of screenToCanvas', () => {
    const camera = { x: 50, y: -30, zoom: 1.5 };
    const screenX = 500;
    const screenY = 400;
    const canvasPos = screenToCanvas(screenX, screenY, camera, windowSize);
    const screenPos = canvasToScreen(canvasPos.x, canvasPos.y, camera, windowSize);
    expect(screenPos.x).toBeCloseTo(screenX);
    expect(screenPos.y).toBeCloseTo(screenY);
  });
});

describe('getViewportBounds', () => {
  const windowSize = { width: 1000, height: 800 };

  it('returns bounds centered on negative camera position', () => {
    const camera = { x: 0, y: 0, zoom: 1 };
    const bounds = getViewportBounds(camera, windowSize);
    expect(bounds.x).toBeCloseTo(-500);
    expect(bounds.y).toBeCloseTo(-400);
    expect(bounds.width).toBe(1000);
    expect(bounds.height).toBe(800);
  });

  it('accounts for camera position', () => {
    const camera = { x: 100, y: 50, zoom: 1 };
    const bounds = getViewportBounds(camera, windowSize);
    expect(bounds.x).toBeCloseTo(-600);
    expect(bounds.y).toBeCloseTo(-450);
  });

  it('scales bounds with zoom', () => {
    const camera = { x: 0, y: 0, zoom: 2 };
    const bounds = getViewportBounds(camera, windowSize);
    // At 2x zoom, viewport shows half the canvas area
    expect(bounds.width).toBe(500);
    expect(bounds.height).toBe(400);
  });

  it('includes buffer when specified', () => {
    const camera = { x: 0, y: 0, zoom: 1 };
    const bounds = getViewportBounds(camera, windowSize, 100);
    expect(bounds.width).toBe(1200);
    expect(bounds.height).toBe(1000);
  });
});

describe('isPointInBounds', () => {
  const bounds = { x: 0, y: 0, width: 100, height: 100 };

  it('returns true for point inside bounds', () => {
    expect(isPointInBounds({ x: 50, y: 50 }, bounds)).toBe(true);
  });

  it('returns true for point on edge', () => {
    expect(isPointInBounds({ x: 0, y: 0 }, bounds)).toBe(true);
    expect(isPointInBounds({ x: 100, y: 100 }, bounds)).toBe(true);
  });

  it('returns false for point outside bounds', () => {
    expect(isPointInBounds({ x: -1, y: 50 }, bounds)).toBe(false);
    expect(isPointInBounds({ x: 101, y: 50 }, bounds)).toBe(false);
  });
});

describe('boundsOverlap', () => {
  it('returns true for overlapping bounds', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 50, y: 50, width: 100, height: 100 };
    expect(boundsOverlap(a, b)).toBe(true);
  });

  it('returns true for contained bounds', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 25, y: 25, width: 50, height: 50 };
    expect(boundsOverlap(a, b)).toBe(true);
  });

  it('returns false for non-overlapping bounds', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 200, y: 0, width: 100, height: 100 };
    expect(boundsOverlap(a, b)).toBe(false);
  });

  it('returns true for touching bounds', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 100, y: 0, width: 100, height: 100 };
    expect(boundsOverlap(a, b)).toBe(true);
  });
});

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('returns min when value is below', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('returns max when value is above', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('distance', () => {
  it('returns 0 for same point', () => {
    expect(distance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it('calculates horizontal distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
  });

  it('calculates diagonal distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});
