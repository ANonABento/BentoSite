'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGesture } from '@use-gesture/react';
import type { Camera, CameraBindings, Position, Size, UseCameraReturn, Velocity } from '../BentoGrid.types';
import { CAMERA, DEFAULT_CAMERA, INTERACTION } from '../BentoGrid.constants';
import { clamp } from './useViewport';

interface UseCameraOptions {
  enabled?: boolean;
  windowSize: Size;
  initialCamera?: Camera;
  onCameraChange?: (camera: Camera) => void;
}

interface PinchMemo {
  initialZoom: number;
  initialDistance: number;
  initialX: number;
  initialY: number;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

export function useCamera({
  enabled = true,
  windowSize,
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

  const zoom = useCallback((delta: number, center?: Position) => {
    stopMomentum();

    setCamera((prev) => {
      const newZoom = clamp(prev.zoom * (1 + delta), CAMERA.minZoom, CAMERA.maxZoom);

      if (!center || newZoom === prev.zoom) {
        return { ...prev, zoom: newZoom };
      }

      const zoomDelta = newZoom / prev.zoom;

      return {
        x: prev.x - (center.x / prev.zoom) * (1 - 1 / zoomDelta),
        y: prev.y - (center.y / prev.zoom) * (1 - 1 / zoomDelta),
        zoom: newZoom,
      };
    });
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
      onPinch: ({ origin: [originX, originY], da: [distanceValue], memo }) => {
        if (!enabled) return memo as PinchMemo | undefined;

        stopMomentum();

        const pinchMemo = memo as PinchMemo | undefined;
        if (!pinchMemo) {
          const currentCamera = cameraRef.current;

          return {
            initialZoom: currentCamera.zoom,
            initialDistance: distanceValue || 1,
            initialX: currentCamera.x,
            initialY: currentCamera.y,
          } satisfies PinchMemo;
        }

        const safeInitialDistance = pinchMemo.initialDistance || 1;
        const scale = distanceValue / safeInitialDistance;
        const newZoom = clamp(pinchMemo.initialZoom * scale, CAMERA.minZoom, CAMERA.maxZoom);
        const zoomDelta = newZoom / pinchMemo.initialZoom;
        const centerX = originX - windowSize.width / 2;
        const centerY = originY - windowSize.height / 2;

        setCamera({
          x: pinchMemo.initialX - (centerX / pinchMemo.initialZoom) * (1 - 1 / zoomDelta),
          y: pinchMemo.initialY - (centerY / pinchMemo.initialZoom) * (1 - 1 / zoomDelta),
          zoom: newZoom,
        });

        return pinchMemo;
      },
      onWheel: ({ event, delta: [, dy] }) => {
        if (!enabled) return;

        event.preventDefault();
        stopMomentum();

        const target = event.currentTarget;
        const rect = target instanceof HTMLElement
          ? target.getBoundingClientRect()
          : { left: 0, top: 0 };
        const cursor = {
          x: event.clientX - rect.left - windowSize.width / 2,
          y: event.clientY - rect.top - windowSize.height / 2,
        };
        const factor = dy > 0 ? CAMERA.wheelZoomOutFactor : CAMERA.wheelZoomInFactor;

        setCamera((prev) => {
          const newZoom = clamp(prev.zoom * factor, CAMERA.minZoom, CAMERA.maxZoom);
          const zoomDelta = newZoom / prev.zoom;

          if (newZoom === prev.zoom) {
            return prev;
          }

          return {
            x: prev.x - (cursor.x / prev.zoom) * (1 - 1 / zoomDelta),
            y: prev.y - (cursor.y / prev.zoom) * (1 - 1 / zoomDelta),
            zoom: newZoom,
          };
        });
      },
    },
    {
      drag: {
        from: () => [0, 0],
        filterTaps: true,
        pointer: { touch: true },
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
        case '=':
        case '+':
          event.preventDefault();
          zoom(0.1);
          break;
        case '-':
        case '_':
          event.preventDefault();
          zoom(-0.1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, pan, reset, zoom]);

  const bind = useCallback((): CameraBindings => ({
    ...bindGesture(),
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
