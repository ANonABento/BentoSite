import { describe, expect, it } from 'vitest';
import {
  canvasToScreen,
  getCameraTransform,
  screenToCanvas,
} from '../core/useViewport';

const windowSize = { width: 1920, height: 1080 };

describe('BentoGrid viewport transforms', () => {
  it('maps screen center to canvas origin when camera is at origin', () => {
    expect(screenToCanvas(960, 540, { x: 0, y: 0, zoom: 1 }, windowSize)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('canvasToScreen is the inverse of screenToCanvas', () => {
    const camera = { x: 123, y: -45, zoom: 1.5 };
    const screen = canvasToScreen(50, -20, camera, windowSize);
    const back = screenToCanvas(screen.x, screen.y, camera, windowSize);

    expect(back.x).toBeCloseTo(50);
    expect(back.y).toBeCloseTo(-20);
  });

  it('produces a transform string with center, scale, and camera offset', () => {
    const transform = getCameraTransform({ x: 10, y: 20, zoom: 2 }, windowSize);

    expect(transform).toContain('translate(960px, 540px)');
    expect(transform).toContain('scale(2)');
    expect(transform).toContain('translate(10px, 20px)');
  });
});
