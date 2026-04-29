import { describe, expect, it } from 'vitest';
import {
  boundsOverlap,
  canvasToScreen,
  clamp,
  distance,
  getCameraTransform,
  getSpawnPositionForBounds,
  getViewportBounds,
  screenToCanvas,
  viewportBoundsToRect,
} from '../core/useViewport';
import { clampCanvasPosition } from '../core/clampToViewport';
import { GRID } from '../BentoGrid.constants';

const windowSize = { width: 1920, height: 1080 };

describe('BentoGrid coordinate transforms', () => {
  it('maps screen center to canvas origin when the camera is at origin', () => {
    const result = screenToCanvas(960, 540, { x: 0, y: 0, zoom: 1 }, windowSize);

    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
  });

  it('subtracts camera offset using the InfiniteGrid sign convention', () => {
    const result = screenToCanvas(960, 540, { x: 100, y: 50, zoom: 1 }, windowSize);

    expect(result.x).toBeCloseTo(-100);
    expect(result.y).toBeCloseTo(-50);
  });

  it('accounts for zoom level', () => {
    const result = screenToCanvas(1060, 540, { x: 0, y: 0, zoom: 2 }, windowSize);

    expect(result.x).toBeCloseTo(50);
    expect(result.y).toBeCloseTo(0);
  });

  it('round trips canvas and screen coordinates', () => {
    const camera = { x: 123, y: -45, zoom: 1.5 };
    const screen = canvasToScreen(50, -20, camera, windowSize);
    const back = screenToCanvas(screen.x, screen.y, camera, windowSize);

    expect(back.x).toBeCloseTo(50);
    expect(back.y).toBeCloseTo(-20);
  });

  it('uses the merged center-scale-camera transform shape', () => {
    const transform = getCameraTransform({ x: 10, y: 20, zoom: 2 }, windowSize);

    expect(transform).toBe('translate(960px, 540px) scale(2) translate(10px, 20px)');
  });
});

describe('BentoGrid viewport bounds', () => {
  it('returns visible canvas bounds', () => {
    const bounds = getViewportBounds({ x: 0, y: 0, zoom: 1 }, { width: 1000, height: 800 });

    expect(bounds).toEqual({
      left: -500,
      top: -400,
      right: 500,
      bottom: 400,
      width: 1000,
      height: 800,
    });
  });

  it('moves bounds left when camera x increases', () => {
    const before = getViewportBounds({ x: 0, y: 0, zoom: 1 }, windowSize);
    const after = getViewportBounds({ x: 100, y: 0, zoom: 1 }, windowSize);

    expect(after.left).toBeLessThan(before.left);
    expect(after.right).toBeLessThan(before.right);
  });

  it('includes screen-space buffer converted through zoom', () => {
    const bounds = getViewportBounds({ x: 0, y: 0, zoom: 2 }, { width: 1000, height: 800 }, 100);

    expect(bounds.width).toBe(600);
    expect(bounds.height).toBe(500);
  });

  it('converts viewport bounds to rect bounds', () => {
    const bounds = getViewportBounds({ x: 10, y: 20, zoom: 1 }, { width: 1000, height: 800 });

    expect(viewportBoundsToRect(bounds)).toEqual({
      x: -510,
      y: -420,
      width: 1000,
      height: 800,
    });
  });
});

describe('BentoGrid viewport helpers', () => {
  it('detects overlapping bounds, including touching edges', () => {
    expect(boundsOverlap(
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 100, y: 0, width: 100, height: 100 },
    )).toBe(true);
    expect(boundsOverlap(
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 101, y: 0, width: 100, height: 100 },
    )).toBe(false);
  });

  it('clamps scalar values', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('calculates point distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('clamps canvas positions to the nearest visible screen edge', () => {
    const result = clampCanvasPosition(
      { x: -1000, y: 0 },
      { width: 200, height: 100 },
      { x: 0, y: 0, zoom: 1 },
      { width: 1000, height: 800 },
      16,
    );

    expect(result.isClamped).toBe(true);
    expect(result.edge).toBe('left');
    expect(canvasToScreen(result.position.x, result.position.y, { x: 0, y: 0, zoom: 1 }, { width: 1000, height: 800 }).x)
      .toBe(116);
  });

  it('centers oversized cards on axes where full visibility is impossible', () => {
    const result = clampCanvasPosition(
      { x: -400, y: 0 },
      { width: 600, height: 100 },
      { x: 0, y: 0, zoom: 1 },
      { width: 500, height: 400 },
      16,
    );
    const screenPosition = canvasToScreen(
      result.position.x,
      result.position.y,
      { x: 0, y: 0, zoom: 1 },
      { width: 500, height: 400 },
    );

    expect(result.isClamped).toBe(true);
    expect(result.edge).toBe('left');
    expect(screenPosition.x).toBe(250);
    expect(screenPosition.y).toBe(200);
  });

  it('calculates spawn positions just outside each viewport edge', () => {
    const bounds = {
      left: -500,
      top: -400,
      right: 500,
      bottom: 400,
      width: 1000,
      height: 800,
    };
    const centerRandom = () => 0.5;

    expect(getSpawnPositionForBounds(bounds, 'top', GRID.CELL_SIZE, centerRandom)).toEqual({ x: 0, y: -580 });
    expect(getSpawnPositionForBounds(bounds, 'bottom', GRID.CELL_SIZE, centerRandom)).toEqual({ x: 0, y: 580 });
    expect(getSpawnPositionForBounds(bounds, 'left', GRID.CELL_SIZE, centerRandom)).toEqual({ x: -680, y: 0 });
    expect(getSpawnPositionForBounds(bounds, 'right', GRID.CELL_SIZE, centerRandom)).toEqual({ x: 680, y: 0 });
  });
});
