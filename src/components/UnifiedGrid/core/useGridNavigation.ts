/**
 * useGridNavigation - Pan, Zoom, and WASD Controls
 *
 * Handles all navigation interactions for the infinite grid:
 * - Mouse/touch drag to pan
 * - Scroll wheel to zoom
 * - Pinch to zoom on touch devices
 * - WASD / Arrow keys for keyboard navigation
 * - Momentum scrolling after drag release
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMotionValue, useAnimationFrame } from 'framer-motion';
import type { Camera, Position, UseGridNavigationReturn } from '../UnifiedGrid.types';
import { CAMERA, KEYBOARD } from '../UnifiedGrid.constants';

interface UseGridNavigationOptions {
  /** Initial camera position */
  initialCamera?: Camera;
  /** Callback when camera changes */
  onCameraChange?: (camera: Camera) => void;
  /** Whether navigation is enabled */
  enabled?: boolean;
  /** LocalStorage key for persisting camera position */
  persistKey?: string;
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Load camera from localStorage
 */
function loadCamera(key: string): Camera | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        typeof parsed.x === 'number' &&
        typeof parsed.y === 'number' &&
        typeof parsed.zoom === 'number'
      ) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Save camera to localStorage
 */
function saveCamera(key: string, camera: Camera): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(camera));
  } catch {
    // Ignore storage errors
  }
}

/** Debounce delay for camera persistence (ms) */
const PERSIST_DEBOUNCE_MS = 250;

export function useGridNavigation(options: UseGridNavigationOptions = {}): UseGridNavigationReturn {
  const {
    initialCamera,
    onCameraChange,
    enabled = true,
    persistKey,
  } = options;

  // Load initial camera from storage or use default
  const [camera, setCamera] = useState<Camera>(() => {
    if (persistKey) {
      const saved = loadCamera(persistKey);
      if (saved) return saved;
    }
    return initialCamera || { ...CAMERA.DEFAULT };
  });

  // Momentum tracking
  const velocityX = useMotionValue(0);
  const velocityY = useMotionValue(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Track pressed keys for continuous movement
  const pressedKeys = useRef<Set<string>>(new Set());

  // Drag start position
  const dragStartRef = useRef<{ x: number; y: number; cameraX: number; cameraY: number } | null>(null);

  /**
   * Update camera with bounds. The updater is pure (no side effects); the
   * persistence + callback effects below react to the resulting `camera` state.
   */
  const updateCamera = useCallback((update: Partial<Camera>) => {
    setCamera((prev) => ({
      x: update.x ?? prev.x,
      y: update.y ?? prev.y,
      zoom: clamp(update.zoom ?? prev.zoom, CAMERA.MIN_ZOOM, CAMERA.MAX_ZOOM),
    }));
  }, []);

  /**
   * Persist camera position with debounce so high-frequency pan animations
   * (~60Hz from useAnimationFrame) don't hammer localStorage.
   */
  useEffect(() => {
    if (!persistKey) return;
    const timeout = setTimeout(() => {
      saveCamera(persistKey, camera);
    }, PERSIST_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [camera, persistKey]);

  /**
   * Notify parent of camera changes. Effect rather than updater-side-effect
   * keeps the setState updater pure (Strict Mode safe).
   */
  useEffect(() => {
    onCameraChange?.(camera);
  }, [camera, onCameraChange]);

  /**
   * Pan the camera by delta
   */
  const pan = useCallback((dx: number, dy: number) => {
    updateCamera({
      x: camera.x + dx / camera.zoom,
      y: camera.y + dy / camera.zoom,
    });
  }, [camera, updateCamera]);

  /**
   * Zoom the camera around a point
   */
  const zoom = useCallback((delta: number, center?: Position) => {
    const newZoom = clamp(camera.zoom * (1 + delta), CAMERA.MIN_ZOOM, CAMERA.MAX_ZOOM);

    if (center) {
      // Zoom toward the point
      const scale = newZoom / camera.zoom;
      updateCamera({
        x: center.x + (camera.x - center.x) * scale,
        y: center.y + (camera.y - center.y) * scale,
        zoom: newZoom,
      });
    } else {
      updateCamera({ zoom: newZoom });
    }
  }, [camera, updateCamera]);

  /**
   * Reset camera to origin
   */
  const reset = useCallback(() => {
    updateCamera({ ...CAMERA.DEFAULT });
    velocityX.set(0);
    velocityY.set(0);
    setIsAnimating(false);
  }, [updateCamera, velocityX, velocityY]);

  /**
   * Handle pointer down (start drag)
   */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      cameraX: camera.x,
      cameraY: camera.y,
    };

    // Stop any momentum animation
    velocityX.set(0);
    velocityY.set(0);
    setIsAnimating(false);
  }, [enabled, camera, velocityX, velocityY]);

  /**
   * Handle pointer move (drag)
   */
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    updateCamera({
      x: dragStartRef.current.cameraX + dx / camera.zoom,
      y: dragStartRef.current.cameraY + dy / camera.zoom,
    });

    // Track velocity for momentum
    velocityX.set(e.movementX);
    velocityY.set(e.movementY);
  }, [isDragging, camera.zoom, updateCamera, velocityX, velocityY]);

  /**
   * Handle pointer up (end drag, start momentum)
   */
  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    dragStartRef.current = null;

    // Start momentum if velocity is high enough
    const vx = velocityX.get();
    const vy = velocityY.get();

    if (Math.abs(vx) > CAMERA.MIN_VELOCITY || Math.abs(vy) > CAMERA.MIN_VELOCITY) {
      setIsAnimating(true);
    }
  }, [isDragging, velocityX, velocityY]);

  /**
   * Handle wheel (zoom or pan)
   */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!enabled) return;

    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Pinch zoom (trackpad)
      zoom(-e.deltaY * CAMERA.ZOOM_SENSITIVITY);
    } else {
      // Pan
      pan(-e.deltaX, -e.deltaY);
    }
  }, [enabled, zoom, pan]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key;

      // Reset
      if (KEYBOARD.RESET.includes(key)) {
        e.preventDefault();
        reset();
        return;
      }

      // Pan keys
      if (
        KEYBOARD.PAN_UP.includes(key) ||
        KEYBOARD.PAN_DOWN.includes(key) ||
        KEYBOARD.PAN_LEFT.includes(key) ||
        KEYBOARD.PAN_RIGHT.includes(key)
      ) {
        e.preventDefault();
        pressedKeys.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, reset]);

  /**
   * Animation frame for keyboard pan and momentum
   */
  useAnimationFrame(() => {
    if (!enabled) return;

    let dx = 0;
    let dy = 0;

    // Keyboard pan
    pressedKeys.current.forEach((key) => {
      if (KEYBOARD.PAN_UP.includes(key)) dy += CAMERA.PAN_SPEED;
      if (KEYBOARD.PAN_DOWN.includes(key)) dy -= CAMERA.PAN_SPEED;
      if (KEYBOARD.PAN_LEFT.includes(key)) dx += CAMERA.PAN_SPEED;
      if (KEYBOARD.PAN_RIGHT.includes(key)) dx -= CAMERA.PAN_SPEED;
    });

    // Momentum
    if (isAnimating && !isDragging) {
      const vx = velocityX.get();
      const vy = velocityY.get();

      dx += vx;
      dy += vy;

      // Apply friction
      velocityX.set(vx * CAMERA.MOMENTUM_FRICTION);
      velocityY.set(vy * CAMERA.MOMENTUM_FRICTION);

      // Stop if velocity is too low
      if (Math.abs(vx) < CAMERA.MIN_VELOCITY && Math.abs(vy) < CAMERA.MIN_VELOCITY) {
        setIsAnimating(false);
        velocityX.set(0);
        velocityY.set(0);
      }
    }

    // Apply movement
    if (dx !== 0 || dy !== 0) {
      pan(dx, dy);
    }
  });

  /**
   * Bind functions for the canvas element
   */
  const bind = useCallback(() => ({
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerLeave: handlePointerUp,
    onWheel: handleWheel,
    style: {
      cursor: isDragging ? 'grabbing' : 'grab',
      touchAction: 'none',
    },
  }), [handlePointerDown, handlePointerMove, handlePointerUp, handleWheel, isDragging]);

  return {
    camera,
    pan,
    zoom,
    reset,
    setCamera: updateCamera,
    bind,
    isAnimating: isAnimating || isDragging,
  };
}
