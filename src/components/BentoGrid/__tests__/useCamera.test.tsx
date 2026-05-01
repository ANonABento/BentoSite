import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CAMERA } from '../BentoGrid.constants';
import { useCamera } from '../core/useCamera';

const windowSize = { width: 1000, height: 800 };

function keyDown(key: string, target: Window | HTMLElement = window): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('useCamera keyboard controls', () => {
  it('keeps zoom fixed when zoom is requested', () => {
    const { result } = renderHook(() => useCamera({
      windowSize,
      initialCamera: { x: 20, y: -10, zoom: 1.5 },
    }));

    act(() => result.current.zoom(10, { x: 100, y: 0 }));

    expect(result.current.camera).toEqual({ x: 20, y: -10, zoom: 1 });

    act(() => result.current.zoom(-10));

    expect(result.current.camera).toEqual({ x: 20, y: -10, zoom: 1 });
  });

  it('pans with WASD using the current zoom', () => {
    const { result } = renderHook(() => useCamera({
      windowSize,
      initialCamera: { x: 0, y: 0, zoom: 2 },
    }));
    const panStep = CAMERA.keyboardPanSpeed / 2;

    act(() => keyDown('w'));
    expect(result.current.camera.y).toBe(panStep);

    act(() => keyDown('s'));
    expect(result.current.camera.y).toBe(0);

    act(() => keyDown('a'));
    expect(result.current.camera.x).toBe(panStep);

    act(() => keyDown('d'));
    expect(result.current.camera.x).toBe(0);
  });

  it('leaves arrow keys for card navigation', () => {
    const { result } = renderHook(() => useCamera({
      windowSize,
      initialCamera: { x: 0, y: 0, zoom: 2 },
    }));

    act(() => keyDown('ArrowUp'));

    expect(result.current.camera).toEqual({ x: 0, y: 0, zoom: 2 });
  });

  it('ignores keyboard shortcuts while typing in editable fields', () => {
    const input = document.createElement('input');
    document.body.append(input);

    const { result } = renderHook(() => useCamera({ windowSize }));

    act(() => keyDown('w', input));

    expect(result.current.camera).toEqual({ x: 0, y: 0, zoom: 1 });
    input.remove();
  });

  it('does not zoom with plus or minus keys', () => {
    const { result } = renderHook(() => useCamera({
      windowSize,
      initialCamera: { x: 0, y: 0, zoom: 1 },
    }));

    act(() => keyDown('+'));
    act(() => keyDown('-'));

    expect(result.current.camera).toEqual({ x: 0, y: 0, zoom: 1 });
  });
});
