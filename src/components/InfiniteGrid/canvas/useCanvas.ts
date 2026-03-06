// useCanvas Hook
// Pan/zoom state management with gesture bindings and momentum

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDrag, usePinch, useWheel } from '@use-gesture/react';
import type { Camera, UseCanvasReturn, Size } from '../InfiniteGrid.types';
import { CAMERA, DEFAULT_CAMERA, INTERACTION } from '../InfiniteGrid.constants';
import { clamp } from './transforms';

interface UseCanvasOptions {
  enabled: boolean;
  windowSize: Size;
}

export function useCanvas({ enabled, windowSize }: UseCanvasOptions): UseCanvasReturn {
  const [camera, setCamera] = useState<Camera>({ ...DEFAULT_CAMERA });
  const [isDragging, setIsDragging] = useState(false);

  // Track current camera in a ref for gesture callbacks (avoids stale closure)
  const cameraRef = useRef<Camera>(camera);
  cameraRef.current = camera;

  // Track drag start position
  const dragStartRef = useRef<{ cameraX: number; cameraY: number } | null>(null);

  // Momentum state
  const momentumRef = useRef<{
    velocity: { x: number; y: number };
    animationId: number | null;
  }>({
    velocity: { x: 0, y: 0 },
    animationId: null,
  });

  // Stop momentum animation
  const stopMomentum = useCallback(() => {
    if (momentumRef.current.animationId !== null) {
      cancelAnimationFrame(momentumRef.current.animationId);
      momentumRef.current.animationId = null;
    }
    momentumRef.current.velocity = { x: 0, y: 0 };
  }, []);

  // Apply momentum animation
  const applyMomentum = useCallback(() => {
    const { velocity } = momentumRef.current;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

    if (speed < CAMERA.momentum.minVelocity) {
      stopMomentum();
      return;
    }

    setCamera((prev) => ({
      ...prev,
      x: prev.x + velocity.x,
      y: prev.y + velocity.y,
    }));

    // Apply friction
    momentumRef.current.velocity = {
      x: velocity.x * CAMERA.momentum.friction,
      y: velocity.y * CAMERA.momentum.friction,
    };

    momentumRef.current.animationId = requestAnimationFrame(applyMomentum);
  }, [stopMomentum]);

  // Reset camera to origin
  const reset = useCallback(() => {
    stopMomentum();
    setCamera({ ...DEFAULT_CAMERA });
  }, [stopMomentum]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopMomentum();
  }, [stopMomentum]);

  // Drag gesture for panning
  const bindDrag = useDrag(
    ({ down, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], first, last }) => {
      if (!enabled) return;

      if (first) {
        stopMomentum();
        // Store starting camera position from ref (avoids stale closure)
        const currentCamera = cameraRef.current;
        dragStartRef.current = { cameraX: currentCamera.x, cameraY: currentCamera.y };
      }

      // Check if this is actually a drag (not just a click)
      const distance = Math.sqrt(mx * mx + my * my);
      if (distance > INTERACTION.dragThreshold) {
        setIsDragging(true);
      }

      // Safely access dragStartRef with null check
      const dragStart = dragStartRef.current;
      if (down && dragStart) {
        // Apply movement relative to drag start
        setCamera((prev) => ({
          ...prev,
          x: dragStart.cameraX + mx / prev.zoom,
          y: dragStart.cameraY + my / prev.zoom,
        }));
      }

      if (last) {
        setIsDragging(false);
        dragStartRef.current = null;

        // Start momentum if velocity is significant
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed > 0.1) {
          setCamera((prev) => {
            momentumRef.current.velocity = {
              x: (dx * speed * 10) / prev.zoom,
              y: (dy * speed * 10) / prev.zoom,
            };
            return prev;
          });
          momentumRef.current.animationId = requestAnimationFrame(applyMomentum);
        }
      }
    },
    {
      from: () => [0, 0],
      filterTaps: true,
      pointer: { touch: true },
    }
  );

  // Pinch gesture for zooming (touch)
  const bindPinch = usePinch(
    ({ origin: [ox, oy], da: [d], memo }) => {
      if (!enabled) return memo;

      // First pinch event - store initial state
      if (memo === undefined) {
        return { initialZoom: camera.zoom, initialDistance: d, initialX: camera.x, initialY: camera.y };
      }

      // Calculate new zoom based on pinch distance change
      const scale = d / memo.initialDistance;
      const newZoom = clamp(
        memo.initialZoom * scale,
        CAMERA.minZoom,
        CAMERA.maxZoom
      );

      // Zoom toward pinch center
      const centerX = ox - windowSize.width / 2;
      const centerY = oy - windowSize.height / 2;
      const zoomDelta = newZoom / memo.initialZoom;

      setCamera({
        x: memo.initialX - (centerX / memo.initialZoom) * (1 - 1 / zoomDelta),
        y: memo.initialY - (centerY / memo.initialZoom) * (1 - 1 / zoomDelta),
        zoom: newZoom,
      });

      return memo;
    },
    {
      scaleBounds: { min: CAMERA.minZoom, max: CAMERA.maxZoom },
      pointer: { touch: true },
    }
  );

  // Wheel gesture for zooming (desktop)
  const bindWheel = useWheel(
    ({ event, delta: [, dy] }) => {
      if (!enabled) return;

      event.preventDefault();
      stopMomentum();

      // Zoom toward cursor position
      const rect = (event.target as HTMLElement).getBoundingClientRect?.() || { left: 0, top: 0 };
      const cursorX = event.clientX - rect.left - windowSize.width / 2;
      const cursorY = event.clientY - rect.top - windowSize.height / 2;

      setCamera((prev) => {
        const zoomFactor = dy > 0 ? 0.95 : 1.05;
        const newZoom = clamp(
          prev.zoom * zoomFactor,
          CAMERA.minZoom,
          CAMERA.maxZoom
        );

        const zoomDelta = newZoom / prev.zoom;

        return {
          x: prev.x - (cursorX / prev.zoom) * (1 - 1 / zoomDelta),
          y: prev.y - (cursorY / prev.zoom) * (1 - 1 / zoomDelta),
          zoom: newZoom,
        };
      });
    },
    {
      eventOptions: { passive: false },
    }
  );

  // Keyboard controls
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      const { keyboardPanSpeed } = CAMERA;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          setCamera((prev) => ({ ...prev, y: prev.y + keyboardPanSpeed / prev.zoom }));
          break;
        case 's':
        case 'arrowdown':
          setCamera((prev) => ({ ...prev, y: prev.y - keyboardPanSpeed / prev.zoom }));
          break;
        case 'a':
        case 'arrowleft':
          setCamera((prev) => ({ ...prev, x: prev.x + keyboardPanSpeed / prev.zoom }));
          break;
        case 'd':
        case 'arrowright':
          setCamera((prev) => ({ ...prev, x: prev.x - keyboardPanSpeed / prev.zoom }));
          break;
        case 'r':
          reset();
          break;
        case '=':
        case '+':
          setCamera((prev) => ({
            ...prev,
            zoom: clamp(prev.zoom * 1.1, CAMERA.minZoom, CAMERA.maxZoom),
          }));
          break;
        case '-':
        case '_':
          setCamera((prev) => ({
            ...prev,
            zoom: clamp(prev.zoom * 0.9, CAMERA.minZoom, CAMERA.maxZoom),
          }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, reset]);

  // Combine all gesture bindings
  const bind = useCallback(() => ({
    ...bindDrag(),
    ...bindPinch(),
    ...bindWheel(),
  }), [bindDrag, bindPinch, bindWheel]);

  return {
    camera,
    reset,
    stopMomentum,
    isDragging,
    bind,
  };
}
