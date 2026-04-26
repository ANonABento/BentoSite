'use client';

import React, { RefObject } from 'react';
import { useProgress } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ModelError, ModelInfo } from './Dimension.types';
import {
  CAMERA_FOV,
  CAMERA_POSITION,
  MIN_PERFORMANCE_SCALE,
  MOBILE_PIXEL_RATIO_MAX,
} from './Dimension.config';
import {
  ErrorMessage,
  LoadingProgress,
  LoadingSpinner,
} from './Dimension.ui';
import {
  ModelWrapper,
  ResponsiveOrbitControls,
  StationaryBackground,
} from './scene';

interface DimensionViewportProps {
  autoRotate: boolean;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  error: ModelError | null;
  isMobile: boolean;
  isWireframe: boolean;
  onError: (error: ModelError) => void;
  onModelClick: () => void;
  onRetry: () => void;
  retryCount: number;
  rotationSpeed: number;
  selectedModel: ModelInfo;
  zoomLevel: number;
  onZoomLevelChange: (zoom: number) => void;
}

function DimensionLoadingFallback() {
  const { progress } = useProgress();
  const safeProgress = Number.isFinite(progress)
    ? Math.min(100, Math.max(0, Math.round(progress)))
    : 0;

  return (
    <div className="w-full h-full bg-[var(--surface-deep)]" aria-busy="true" role="status">
      <span className="sr-only">Loading 3D model...</span>
      <Canvas
        camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
        performance={{ min: MIN_PERFORMANCE_SCALE }}
        gl={{ preserveDrawingBuffer: true }}
      />
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 1000 }}
      >
        <LoadingSpinner />
      </div>
      <LoadingProgress progress={safeProgress} />
    </div>
  );
}

export function DimensionViewport({
  autoRotate,
  canvasRef,
  controlsRef,
  error,
  isMobile,
  isWireframe,
  onError,
  onModelClick,
  onRetry,
  retryCount,
  rotationSpeed,
  selectedModel,
  zoomLevel,
  onZoomLevelChange,
}: DimensionViewportProps) {
  if (error) {
    return (
      <div className="w-full h-full bg-[var(--surface-deep)]">
        <Canvas
          camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
          performance={{ min: MIN_PERFORMANCE_SCALE }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <ambientLight intensity={0.3} />
          <pointLight position={[15, 15, 15]} intensity={0.8} />
          <pointLight position={[-10, 10, -10]} intensity={0.4} />
          <StationaryBackground />
          <ResponsiveOrbitControls ref={controlsRef} autoRotate={autoRotate} isMobile={isMobile} />
        </Canvas>
        <ErrorMessage error={error} onRetry={onRetry} isMobile={isMobile} />
      </div>
    );
  }

  return (
    <React.Suspense
      fallback={<DimensionLoadingFallback />}
    >
      <Canvas
        camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
        key={`canvas-${selectedModel.id}-${retryCount}`}
        performance={{ min: MIN_PERFORMANCE_SCALE }}
        gl={{ preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          if (isMobile) {
            gl.shadowMap.enabled = false;
            gl.setPixelRatio(Math.min(window.devicePixelRatio, MOBILE_PIXEL_RATIO_MAX));
          } else {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }

          gl.autoClear = true;
        }}
        ref={canvasRef}
      >
        <ambientLight intensity={0.3} />
        <pointLight
          position={[15, 15, 15]}
          intensity={isMobile ? 0.6 : 0.8}
          castShadow={!isMobile}
        />
        <pointLight
          position={[-10, 10, -10]}
          intensity={isMobile ? 0.2 : 0.4}
          castShadow={!isMobile}
        />
        <StationaryBackground />
        <ModelWrapper
          modelPath={selectedModel.path}
          onError={onError}
          autoRotate={autoRotate}
          onClick={onModelClick}
          isWireframe={isWireframe}
          rotationSpeed={rotationSpeed}
        />
        <ResponsiveOrbitControls
          ref={controlsRef}
          autoRotate={autoRotate}
          isMobile={isMobile}
          rotationSpeed={rotationSpeed}
          zoomLevel={zoomLevel}
          onZoomChange={onZoomLevelChange}
        />
      </Canvas>
    </React.Suspense>
  );
}
