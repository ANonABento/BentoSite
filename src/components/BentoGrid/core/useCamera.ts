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

export function useCamera({
  enabled = true,
  windowSize: _windowSize,
  initialCamera = { ...DEFAULT_CAMERA },
  onCameraChange,
}: UseCameraOptions): UseCameraReturn {
  const [camera, setCameraState] = useState<Camera>(initialCamera);
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
      zoom: DEFAULT_CAMERA.zoom,
    }));
  }, [setCamera, stopMomentum]);

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
    setCamera({ ...DEFAULT_CAMERA });
  }, [setCamera, stopMomentum]);

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
        pointer: { touch: true, buttons: [1, 4] },
      },
      pinch: {
        scaleBounds: { min: CAMERA.minZoom, max: CAMERA.maxZoom },
        pointer: { touch: true },
      },
      wheel: {
        eventOptions: { passive: false },
      },
    },
  );

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const panAmount = CAMERA.keyboardPanSpeed;

      switch (event.key.toLowerCase()) {
        case 'w':
          event.preventDefault();
          pan(0, panAmount);
          break;
        case 's':
          event.preventDefault();
          pan(0, -panAmount);
          break;
        case 'a':
          event.preventDefault();
          pan(panAmount, 0);
          break;
        case 'd':
          event.preventDefault();
          pan(-panAmount, 0);
          break;
        case 'r':
          event.preventDefault();
          reset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, pan, reset]);

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
