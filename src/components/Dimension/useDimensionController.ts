'use client';

import { useCallback, useRef, useState } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  AVAILABLE_MODELS,
  CAMERA_POSITION,
  CAMERA_PRESETS,
} from './Dimension.config';
import {
  useFullscreen,
  useIsMobile,
  useKeyboardShortcuts,
  useScreenshot,
} from './Dimension.hooks';
import { getInitialModel } from './Dimension.utils';
import type { ModelError, ModelInfo } from './Dimension.types';

export function useDimensionController({ modelPath }: { modelPath?: string } = {}) {
  const [error, setError] = useState<ModelError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelInfo>(() => getInitialModel(modelPath));
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showCameraPresets, setShowCameraPresets] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(14);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const isMobile = useIsMobile();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  // Info panel defaults closed on phones, open on desktops, and flips
  // automatically when the viewport crosses the breakpoint. We use the
  // "adjust state during render" pattern (vs. an effect) so React can
  // bail out before commit instead of triggering a second render.
  const [showModelInfo, setShowModelInfo] = useState(() => !isMobile);
  const [previousIsMobile, setPreviousIsMobile] = useState(isMobile);
  if (previousIsMobile !== isMobile) {
    setPreviousIsMobile(isMobile);
    setShowModelInfo(!isMobile);
  }

  // Same pattern for prop-driven resets: when the parent swaps the
  // `modelPath`, rebuild the selected model and clear any prior error
  // in render instead of via an effect.
  const [previousModelPath, setPreviousModelPath] = useState(modelPath);
  if (previousModelPath !== modelPath) {
    setPreviousModelPath(modelPath);
    setSelectedModel(getInitialModel(modelPath));
    setError(null);
  }

  const { containerRef, isFullscreen, toggleFullscreen: handleFullscreen } = useFullscreen();
  const { canvasRef, capture: handleScreenshot } = useScreenshot(
    () => selectedModel.name
  );

  const handleError = useCallback((nextError: ModelError) => {
    setError(nextError);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount((previous) => previous + 1);
  }, []);

  const handleCameraPreset = useCallback((preset: string) => {
    const position = CAMERA_PRESETS[preset as keyof typeof CAMERA_PRESETS];
    const controls = controlsRef.current;
    if (!controls || !position) {
      return;
    }

    const [x, y, z] = position;
    controls.object.position.set(x, y, z);
    controls.update();
  }, []);

  const handleModelClick = useCallback(() => {
    if (isMobile) {
      setAutoRotate((previous) => !previous);
    }
  }, [isMobile]);

  const handleResetView = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.reset();
    // `controls.reset()` restores the saved initial position (set by drei
    // on mount, which is `CAMERA_POSITION`). Mirror the slider state to
    // the actual distance so the UI doesn't lie until the next user drag.
    setZoomLevel(Math.round(controls.object.position.length()));
  }, []);

  const handleZoomFit = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    controls.object.position.set(...CAMERA_POSITION);
    controls.target.set(0, 0, 0);
    controls.update();
    // Derive zoom from the actual camera distance rather than a hardcoded
    // 14 — `CAMERA_POSITION` magnitude is ~13.86, so 14 would drift on the
    // very first OrbitControls onChange.
    setZoomLevel(Math.round(controls.object.position.length()));
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(zoom);
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    // Guard against camera-at-origin (length 0 → normalize returns NaN
    // → multiplying produces a wedged camera). Fall back to the default
    // direction so the slider always has a valid axis to scale along.
    const position = controls.object.position;
    const direction = position.lengthSq() > 1e-6
      ? position.clone().normalize()
      : new THREE.Vector3(...CAMERA_POSITION).normalize();
    position.copy(direction.multiplyScalar(zoom));
    controls.update();
  }, []);

  const handleModelSelect = useCallback((model: ModelInfo) => {
    setSelectedModel(model);
    setError(null);
    setRetryCount((previous) => previous + 1);
    setShowModelInfo(true);
  }, []);

  const handleRotationSpeedChange = useCallback((speed: number) => {
    setRotationSpeed(speed);
  }, []);

  const handleModelManager = useCallback(() => {
    setShowModelSelector(true);
  }, []);

  useKeyboardShortcuts({
    onResetView: handleResetView,
    onToggleAutoRotate: () => setAutoRotate((previous) => !previous),
    onToggleWireframe: () => setIsWireframe((previous) => !previous),
    onScreenshot: handleScreenshot,
    onToggleFullscreen: handleFullscreen,
    onZoomFit: handleZoomFit,
    onCameraPresets: () => setShowCameraPresets((previous) => !previous),
    // 'M' is only meaningful with multiple models — skip the binding
    // entirely otherwise so the shortcut doesn't open a single-item modal.
    onModelManager: AVAILABLE_MODELS.length > 1 ? handleModelManager : undefined,
  });

  return {
    autoRotate,
    canvasRef,
    containerRef,
    controlsRef,
    error,
    handleCameraPreset,
    handleError,
    handleFullscreen,
    handleModelClick,
    handleModelSelect,
    handleModelManager,
    handleRotationSpeedChange,
    handleResetView,
    handleRetry,
    handleScreenshot,
    handleZoomChange,
    handleZoomFit,
    isFullscreen,
    isMobile,
    isWireframe,
    retryCount,
    rotationSpeed,
    selectedModel,
    setAutoRotate,
    setIsWireframe,
    setShowCameraPresets,
    setShowModelInfo,
    setShowModelSelector,
    showCameraPresets,
    showModelInfo,
    showModelSelector,
    zoomLevel,
  };
}
