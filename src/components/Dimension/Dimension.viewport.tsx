'use client';

import React, { RefObject, useEffect } from 'react';
import { useProgress } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
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
 * WebGL needs concrete numbers/hexes — Three.js can't read CSS vars. We could
 * pull them from the cascade with `getComputedStyle`, but ThemeProvider sets
 * the html class inside a `useEffect` that runs AFTER render, so the cascade
 * is one render behind during the very tick we'd read it. Result: the canvas
 * lags one click behind the rest of the UI. Mirror the values from
 * theme.css here so the JS source of truth flips synchronously with `theme`.
 */
const VIEWER_THEMES: Record<'dark' | 'light', ViewerTheme> = {
  dark: { bg: '#050507', ambient: 0.32, keyIntensity: 0.95, fillIntensity: 0.45 },
  light: { bg: '#e8eaef', ambient: 0.6, keyIntensity: 0.7, fillIntensity: 0.35 },
};

function useViewerTheme(): ViewerTheme {
  const { theme } = useTheme();
  return VIEWER_THEMES[theme];
}

/**
 * Re-applies the WebGL clear color whenever the theme bg changes. The
 * Canvas's `onCreated` only fires once at mount, so without this the GPU
 * keeps clearing to the original color until the canvas remounts (e.g. by
 * switching viewfinder tabs). This child lives inside <Canvas>, picks up
 * the renderer via `useThree`, and updates it imperatively.
 */
function ClearColorSync({ color }: { color: string }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    gl.setClearColor(color, 1);
  }, [gl, color]);
  return null;
}

/**
 * 3-point studio rig — directional key for crisp form, soft point fill
 * from the opposite side, low ambient base. Shared between the error
 * preview canvas and the main scene canvas so the lighting can't drift
 * between the two surfaces.
 */
function StudioLighting({ theme, isMobile }: { theme: ViewerTheme; isMobile: boolean }) {
  return (
    <>
      <ambientLight intensity={theme.ambient} />
      <directionalLight
        position={[10, 12, 8]}
        intensity={isMobile ? theme.keyIntensity * 0.8 : theme.keyIntensity}
        castShadow={!isMobile}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight
        position={[-8, 4, -6]}
        intensity={isMobile ? theme.fillIntensity * 0.7 : theme.fillIntensity}
        castShadow={false}
      />
    </>
  );
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
      >
        <ClearColorSync color={bg} />
      </Canvas>
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
        >
          <ClearColorSync color={viewerTheme.bg} />
          <StudioLighting theme={viewerTheme} isMobile={isMobile} />
          <StationaryBackground isMobile={isMobile} />
          <ResponsiveOrbitControls ref={controlsRef} isMobile={isMobile} />
        </Canvas>
        <ErrorMessage error={error} onRetry={onRetry} isMobile={isMobile} />
      </div>
    );
  }

  return (
    <React.Suspense fallback={<DimensionLoadingFallback bg={viewerTheme.bg} />}>
      <Canvas
        aria-label={`${selectedModel.name} interactive 3D scene`}
        role="img"
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
          // Clear color is owned by <ClearColorSync> below so it follows
          // theme changes at runtime instead of being baked in at mount.
        }}
        style={{ background: viewerTheme.bg }}
        ref={canvasRef}
      >
        <ClearColorSync color={viewerTheme.bg} />
        <StudioLighting theme={viewerTheme} isMobile={isMobile} />
        <StationaryBackground isMobile={isMobile} />
        <ModelWrapper
          modelPath={selectedModel.path}
          onError={onError}
          autoRotate={autoRotate}
          onClick={onModelClick}
          isWireframe={isWireframe}
          rotationSpeed={rotationSpeed}
          isMobile={isMobile}
        />
        <ResponsiveOrbitControls
          ref={controlsRef}
          isMobile={isMobile}
          zoomLevel={zoomLevel}
          onZoomChange={onZoomLevelChange}
        />
      </Canvas>
    </React.Suspense>
  );
}
