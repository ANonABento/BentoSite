'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGesture } from '@use-gesture/react';
import { clamp } from '@/lib/utils';
import type { Camera, CameraBindings, Position, Size, UseCameraReturn, Velocity } from '../BentoGrid.types';
import { CAMERA, DEFAULT_CAMERA, INTERACTION } from '../BentoGrid.constants';
import { isEditableTarget } from './keyboard';

interface UseCameraOptions {
  enabled?: boolean;
  windowSize: Size;
  initialCamera?: Camera;
  onCameraChange?: (camera: Camera) => void;
}

function normalizeWheelDelta(delta: number, deltaMode: number): number {
  if (deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return delta * 16;
  }

  if (deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return delta * 320;
  }

  return delta;
}

/**
 * Zoom that keeps cards a similar share of the screen on any display:
 * 1.0 on a ~1760×1040 window, larger on big monitors, smaller on laptops.
 */
export function fitZoom({ width, height }: Size): number {
  return clamp(Math.min(width / CAMERA.referenceWidth, height / CAMERA.referenceHeight), CAMERA.minFitZoom, CAMERA.maxFitZoom);
}

export function useCamera({
  enabled = true,
  windowSize,
  initialCamera,
  onCameraChange,
}: UseCameraOptions): UseCameraReturn {
  const baseZoom = fitZoom(windowSize);
  const [camera, setCameraState] = useState<Camera>(() => initialCamera ?? { ...DEFAULT_CAMERA, zoom: baseZoom });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const cameraRef = useRef<Camera>(camera);
  const dragStartRef = useRef<{ cameraX: number; cameraY: number } | null>(null);
  const momentumRef = useRef<{
    velocity: Velocity;
    animationId: number | null;
  }>({
    velocity: { x: 0, y: 0 },
    animationId: null,
  });

  useEffect(() => {
    cameraRef.current = camera;
    onCameraChange?.(camera);
  }, [camera, onCameraChange]);

  const stopMomentum = useCallback(() => {
    if (momentumRef.current.animationId !== null) {
      cancelAnimationFrame(momentumRef.current.animationId);
      momentumRef.current.animationId = null;
    }

    momentumRef.current.velocity = { x: 0, y: 0 };
    setIsAnimating(false);
  }, []);

  const setCamera = useCallback<UseCameraReturn['setCamera']>((next) => {
    setCameraState((prev) => {
      const updated = typeof next === 'function'
        ? next(prev)
        : {
            x: next.x ?? prev.x,
            y: next.y ?? prev.y,
            zoom: next.zoom ?? prev.zoom,
          };

      return {
        x: updated.x,
        y: updated.y,
        zoom: clamp(updated.zoom, CAMERA.minZoom, CAMERA.maxZoom),
      };
    });
  }, []);

  const applyMomentum = useCallback(function applyMomentumFrame() {
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

    momentumRef.current.velocity = {
      x: velocity.x * CAMERA.momentum.friction,
      y: velocity.y * CAMERA.momentum.friction,
    };
    momentumRef.current.animationId = requestAnimationFrame(applyMomentumFrame);
  }, [setCamera, stopMomentum]);

  const startMomentum = useCallback((velocity: Velocity) => {
    stopMomentum();
    momentumRef.current.velocity = velocity;
    setIsAnimating(true);
    momentumRef.current.animationId = requestAnimationFrame(applyMomentum);
  }, [applyMomentum, stopMomentum]);

  const pan = useCallback((dx: number, dy: number) => {
    setCamera((prev) => ({
      ...prev,
      x: prev.x + dx / prev.zoom,
      y: prev.y + dy / prev.zoom,
    }));
  }, [setCamera]);

  const zoom = useCallback((_delta: number, _center?: Position) => {
    stopMomentum();
    setCamera((prev) => ({
      ...prev,
      zoom: baseZoom,
    }));
  }, [baseZoom, setCamera, stopMomentum]);

  // Follow window resizes so the board keeps its proportions.
  useEffect(() => {
    setCamera((prev) => (prev.zoom === baseZoom ? prev : { ...prev, zoom: baseZoom }));
  }, [baseZoom, setCamera]);

  const handleWheelPan = useCallback((dx: number, dy: number, deltaMode: number) => {
    stopMomentum();
    const normalizedX = normalizeWheelDelta(dx, deltaMode);
    const normalizedY = normalizeWheelDelta(dy, deltaMode);

    setCamera((prev) => ({
      ...prev,
      x: prev.x - normalizedX / prev.zoom,
      y: prev.y - normalizedY / prev.zoom,
    }));
  }, [setCamera, stopMomentum]);

  const reset = useCallback(() => {
    stopMomentum();
    setCamera({ ...DEFAULT_CAMERA, zoom: baseZoom });
  }, [baseZoom, setCamera, stopMomentum]);

  useEffect(() => () => stopMomentum(), [stopMomentum]);

  const bindGesture = useGesture(
    {
      onDrag: ({ down, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], first, last }) => {
        if (!enabled) return;

        if (first) {
          stopMomentum();
          const currentCamera = cameraRef.current;
          dragStartRef.current = {
            cameraX: currentCamera.x,
            cameraY: currentCamera.y,
          };
        }

        const distance = Math.sqrt(mx * mx + my * my);
        if (distance > INTERACTION.dragThreshold) {
          setIsDragging(true);
        }

        const dragStart = dragStartRef.current;
        if (down && dragStart) {
          setCamera((prev) => ({
            ...prev,
            x: dragStart.cameraX + mx / prev.zoom,
            y: dragStart.cameraY + my / prev.zoom,
          }));
        }

        if (last) {
          setIsDragging(false);
          dragStartRef.current = null;

          const currentZoom = cameraRef.current.zoom;
          const momentumVelocity = {
            x: (dx * vx * 10) / currentZoom,
            y: (dy * vy * 10) / currentZoom,
          };
          const speed = Math.sqrt(
            momentumVelocity.x * momentumVelocity.x +
            momentumVelocity.y * momentumVelocity.y,
          );

          if (speed > CAMERA.momentum.minVelocity) {
            startMomentum(momentumVelocity);
          }
        }
      },
      onPinch: ({ event, memo }) => {
        if (!enabled) return memo;
        event.preventDefault();
        stopMomentum();
        return memo;
      },
      onWheel: ({ event, delta: [dx, dy] }) => {
        if (!enabled) return;

        event.preventDefault();
        handleWheelPan(dx, dy, event.deltaMode);
      },
    },
    {
      drag: {
        from: () => [0, 0],
        filterTaps: true,
        // `capture: false` matters on touch devices: with the default pointer
        // capture, every pointerup lands on this container instead of the card
        // under the finger, and the browser then never dispatches a click to
        // that card. On any tablet — touch input, viewport wide enough for the
        // canvas view — tapping a project, game, or photo did nothing at all.
        pointer: { touch: true, buttons: [1, 4], capture: false },
      },
      pinch: {
        scaleBounds: { min: CAMERA.minZoom, max: CAMERA.maxZoom },
        pointer: { touch: true },
        eventOptions: { passive: false },
      },
      wheel: {
        eventOptions: { passive: false },
      },
    },
  );

  // WASD pans continuously while held: velocity eases toward the held
  // direction every frame and eases back to zero on release, rather than
  // jumping on each key-repeat event.
  useEffect(() => {
    if (!enabled) return;

    const held = new Set<string>();
    const velocity = { x: 0, y: 0 };
    let frame: number | null = null;
    let last = 0;

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      let dx = (held.has('a') ? 1 : 0) - (held.has('d') ? 1 : 0);
      let dy = (held.has('w') ? 1 : 0) - (held.has('s') ? 1 : 0);
      const length = Math.hypot(dx, dy);
      if (length > 0) {
        dx /= length;
        dy /= length;
      }
      const ease = 1 - Math.exp(-dt * CAMERA.keyboardPanResponse);
      velocity.x += (dx * CAMERA.keyboardPanSpeed - velocity.x) * ease;
      velocity.y += (dy * CAMERA.keyboardPanSpeed - velocity.y) * ease;

      if (held.size === 0 && Math.hypot(velocity.x, velocity.y) < 5) {
        velocity.x = 0;
        velocity.y = 0;
        frame = null;
        return;
      }

      pan(velocity.x * dt, velocity.y * dt);
      frame = requestAnimationFrame(step);
    };

    const start = () => {
      if (frame !== null) return;
      last = performance.now();
      frame = requestAnimationFrame(step);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();

      if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        event.preventDefault();
        if (!held.has(key)) stopMomentum();
        held.add(key);
        start();
      } else if (key === 'r' && !event.repeat) {
        event.preventDefault();
        held.clear();
        velocity.x = 0;
        velocity.y = 0;
        reset();
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => held.delete(event.key.toLowerCase());
    const releaseAll = () => held.clear();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', releaseAll);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', releaseAll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [enabled, pan, reset, stopMomentum]);

  const bind = useCallback((): CameraBindings => ({
    ...bindGesture(),
    onAuxClick: (event) => {
      if (event.button === 1) {
        event.preventDefault();
      }
    },
    onMouseDown: (event) => {
      if (event.button === 1) {
        event.preventDefault();
      }
    },
    style: {
      cursor: isDragging ? 'grabbing' : 'grab',
      touchAction: 'none',
    },
  }), [bindGesture, isDragging]);

  return {
    camera,
    cameraRef,
    pan,
    zoom,
    setCamera,
    reset,
    stopMomentum,
    isDragging,
    isAnimating: isAnimating || isDragging,
    bind,
  };
}
