'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useToast } from '@/components/ui/Toast';
import {
  AVAILABLE_MODELS,
  CAMERA_POSITION,
  DEFAULT_MODEL_PATH,
} from './Dimension.config';
import {
  useIsMobile,
  useKeyboardShortcuts,
  useScreenSize,
} from './Dimension.hooks';
import type { ModelError, ModelInfo } from './Dimension.types';

const CAMERA_PRESETS = {
  front: [0, 0, 10] as [number, number, number],
  back: [0, 0, -10] as [number, number, number],
  left: [-10, 0, 0] as [number, number, number],
  right: [10, 0, 0] as [number, number, number],
  top: [0, 10, 0] as [number, number, number],
  bottom: [0, -10, 0] as [number, number, number],
  isometric: [8, 8, 8] as [number, number, number],
  reset: CAMERA_POSITION,
} as const;

function getFallbackModel(): ModelInfo {
  return {
    id: 'fallback',
    name: 'No Models Available',
    path: DEFAULT_MODEL_PATH,
    thumbnail: '',
    fileSize: 0,
    dimensions: { width: 0, height: 0, depth: 0 },
    vertexCount: 0,
    description: 'No models configured',
    category: 'None',
  };
}

function getInitialModel(modelPath?: string): ModelInfo {
  if (modelPath) {
    const existingModel = AVAILABLE_MODELS.find((model) => model.path === modelPath);
    if (existingModel) {
      return existingModel;
    }

    return {
      id: `external-${modelPath}`,
      name: 'Project Model',
      path: modelPath,
      thumbnail: '',
      fileSize: 0,
      dimensions: { width: 0, height: 0, depth: 0 },
      vertexCount: 0,
      description: 'Model provided by the selected project.',
      category: 'Project',
    };
  }

  return AVAILABLE_MODELS[0] ?? getFallbackModel();
}

export function useDimensionController({ modelPath }: { modelPath?: string } = {}) {
  const [error, setError] = useState<ModelError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelInfo>(() => getInitialModel(modelPath));
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCameraPresets, setShowCameraPresets] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(14);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const isMobile = useIsMobile();
  const screenSize = useScreenSize();
  const { success: toastSuccess, error: toastError } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleError = useCallback((nextError: ModelError) => {
    setError(nextError);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount((previous) => previous + 1);
  }, []);

  const handleScreenshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toastError('Screenshot failed: Canvas not available');
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        toastError('Screenshot failed: Could not capture image');
        return;
      }

      let url: string | null = null;
      try {
        url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedModel.name.replace(/[^a-z0-9]/gi, '_')}_screenshot.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toastSuccess('Screenshot saved!');
      } catch (downloadError) {
        toastError('Screenshot failed: Download error');
        if (process.env.NODE_ENV === 'development') {
          console.error('Screenshot failed:', downloadError);
        }
      } finally {
        if (url) {
          URL.revokeObjectURL(url);
        }
      }
    }, 'image/png');
  }, [selectedModel.name, toastError, toastSuccess]);

  const handleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (!isFullscreen) {
      container.requestFullscreen?.();
      return;
    }

    document.exitFullscreen?.();
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    setShowModelInfo(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    setSelectedModel(getInitialModel(modelPath));
    setError(null);
  }, [modelPath]);

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
    controlsRef.current?.reset();
  }, []);

  const handleZoomFit = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    controls.object.position.set(...CAMERA_POSITION);
    controls.target.set(0, 0, 0);
    controls.update();
    setZoomLevel(14);
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(zoom);
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    const direction = controls.object.position.clone().normalize();
    controls.object.position.copy(direction.multiplyScalar(zoom));
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
    onModelManager: handleModelManager,
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
    screenSize,
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
