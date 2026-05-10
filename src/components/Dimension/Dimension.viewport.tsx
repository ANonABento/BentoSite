'use client';

import React, { RefObject, useMemo } from 'react';
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
import { useTheme } from '@/lib/theme-context';

interface ViewerTheme {
  bg: string;
  ambient: number;
  keyIntensity: number;
  fillIntensity: number;
}

/**
 * Reads `--viewfinder-*` CSS variables from :root so the WebGL canvas can
 * follow theme changes (Three.js can't read CSS vars directly). The current
 * theme is the dependency so this recomputes after the theme class on
 * `<html>` flips and the cascade has settled to the new values.
 */
function readViewerTheme(theme: 'dark' | 'light'): ViewerTheme {
  const ssrFallback: ViewerTheme = theme === 'light'
    ? { bg: '#e8eaef', ambient: 0.6, keyIntensity: 0.7, fillIntensity: 0.35 }
    : { bg: '#050507', ambient: 0.32, keyIntensity: 0.95, fillIntensity: 0.45 };
  if (typeof window === 'undefined') return ssrFallback;
  const root = window.getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    root.getPropertyValue(name).trim() || fallback;
  const num = (value: string, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return {
    bg: read('--viewfinder-bg', ssrFallback.bg),
    ambient: num(read('--viewfinder-ambient', String(ssrFallback.ambient)), ssrFallback.ambient),
    keyIntensity: num(read('--viewfinder-key-intensity', String(ssrFallback.keyIntensity)), ssrFallback.keyIntensity),
    fillIntensity: num(read('--viewfinder-fill-intensity', String(ssrFallback.fillIntensity)), ssrFallback.fillIntensity),
  };
}

function useViewerTheme(): ViewerTheme {
  const { theme } = useTheme();
  return useMemo(() => readViewerTheme(theme), [theme]);
}

interface DimensionViewportProps {
  allowScreenshots: boolean;
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

function DimensionLoadingFallback({ bg }: { bg: string }) {
  const { progress } = useProgress();
  const safeProgress = Number.isFinite(progress)
    ? Math.min(100, Math.max(0, Math.round(progress)))
    : 0;

  return (
    <div className="w-full h-full" style={{ background: bg }} aria-busy="true" role="status">
      <span className="sr-only">Loading 3D model...</span>
      <Canvas
        aria-label="Loading 3D model scene"
        camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
        performance={{ min: MIN_PERFORMANCE_SCALE }}
        dpr={[1, MOBILE_PIXEL_RATIO_MAX]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        style={{ background: bg }}
        onCreated={({ gl }) => {
          gl.setClearColor(bg, 1);
        }}
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
  allowScreenshots,
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
  const viewerTheme = useViewerTheme();

  if (error) {
    return (
      <div className="w-full h-full" style={{ background: viewerTheme.bg }}>
        <Canvas
          aria-label="3D model error preview"
          camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
          performance={{ min: MIN_PERFORMANCE_SCALE }}
          dpr={[1, isMobile ? MOBILE_PIXEL_RATIO_MAX : 2]}
          gl={{
            antialias: !isMobile,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: allowScreenshots,
          }}
          style={{ background: viewerTheme.bg }}
          onCreated={({ gl }) => {
            gl.setClearColor(viewerTheme.bg, 1);
          }}
        >
          <ambientLight intensity={viewerTheme.ambient} />
          <directionalLight position={[10, 12, 8]} intensity={viewerTheme.keyIntensity} />
          <pointLight position={[-8, 4, -6]} intensity={viewerTheme.fillIntensity} />
          <StationaryBackground />
          <ResponsiveOrbitControls ref={controlsRef} autoRotate={autoRotate} isMobile={isMobile} />
        </Canvas>
        <ErrorMessage error={error} onRetry={onRetry} isMobile={isMobile} />
      </div>
    );
  }

  return (
    <React.Suspense fallback={<DimensionLoadingFallback bg={viewerTheme.bg} />}>
      <Canvas
        aria-label={`${selectedModel.name} interactive 3D scene`}
        camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
        key={`canvas-${selectedModel.id}-${retryCount}`}
        performance={{ min: MIN_PERFORMANCE_SCALE }}
        dpr={[1, isMobile ? MOBILE_PIXEL_RATIO_MAX : 2]}
        gl={{
          antialias: !isMobile,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: allowScreenshots,
        }}
        onCreated={({ gl }) => {
          if (isMobile) {
            gl.shadowMap.enabled = false;
            gl.setPixelRatio(Math.min(window.devicePixelRatio, MOBILE_PIXEL_RATIO_MAX));
          } else {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }

          gl.autoClear = true;
          gl.setClearColor(viewerTheme.bg, 1);
        }}
        style={{ background: viewerTheme.bg }}
        ref={canvasRef}
      >
        {/* 3-point studio rig — directional key for crisp form, soft pointer
            fill from the opposite side, low ambient base. Intensities follow
            the theme so light mode reads brighter without blowing out. */}
        <ambientLight intensity={viewerTheme.ambient} />
        <directionalLight
          position={[10, 12, 8]}
          intensity={isMobile ? viewerTheme.keyIntensity * 0.8 : viewerTheme.keyIntensity}
          castShadow={!isMobile}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight
          position={[-8, 4, -6]}
          intensity={isMobile ? viewerTheme.fillIntensity * 0.7 : viewerTheme.fillIntensity}
          castShadow={false}
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
