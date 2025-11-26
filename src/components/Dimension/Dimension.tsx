'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// Import all types
import type { ModelInfo, ModelError } from './Dimension.types';

// Import configuration and data
import { 
  AVAILABLE_MODELS, 
  DEFAULT_MODEL_PATH, 
  CAMERA_POSITION, 
  CAMERA_FOV, 
  MIN_PERFORMANCE_SCALE, 
  MOBILE_PIXEL_RATIO_MAX 
} from './Dimension.config';

// Import utilities
import { isMobileDevice } from './Dimension.utils';

// Import hooks
import { 
  useIsMobile, 
  useScreenSize, 
  usePerformanceMonitor, 
  useKeyboardShortcuts, 
  useTouchGestures 
} from './Dimension.hooks';

// Import UI components
import { 
  ModelInfoDisplay,
  ModelSelector, 
  ControlPanel, 
  LoadingSpinner, 
  LoadingProgress, 
  ErrorMessage 
} from './Dimension.ui';

// Import 3D components
import { 
  STLModelWrapper,
  StationaryBackground,
  ResponsiveOrbitControls 
} from './Dimension.3d';

// Camera preset positions
const CAMERA_PRESETS = {
  front: [0, 0, 10] as [number, number, number],
  back: [0, 0, -10] as [number, number, number],
  left: [-10, 0, 0] as [number, number, number],
  right: [10, 0, 0] as [number, number, number],
  top: [0, 10, 0] as [number, number, number],
  bottom: [0, -10, 0] as [number, number, number],
  isometric: [8, 8, 8] as [number, number, number],
  reset: CAMERA_POSITION
} as const;

export default function DimensionViewer() {
  // Component state
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<ModelError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelInfo>(AVAILABLE_MODELS[0]);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(!useIsMobile());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCameraPresets, setShowCameraPresets] = useState(false);
  
  // Hooks
  const isMobile = useIsMobile();
  const screenSize = useScreenSize();
  const controlsRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Error handling
  const handleError = (error: ModelError) => {
    setError(error);
    setLoadingProgress(0);
  };

  const handleRetry = () => {
    setError(null);
    setLoadingProgress(0);
    setRetryCount(prev => prev + 1);
  };

  // Phase 1.7: Screenshot functionality
  const handleScreenshot = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error('Canvas not available for screenshot');
        return;
      }

      // Create download link
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to create blob from canvas');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedModel.name.replace(/[^a-z0-9]/gi, '_')}_screenshot.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  }, [selectedModel.name]);

  // Phase 1.7: Fullscreen functionality
  const handleFullscreen = useCallback(() => {
    const container = document.querySelector('.dimension-viewer-container') as HTMLElement;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Phase 1.7: Camera preset functionality
  const handleCameraPreset = useCallback((preset: keyof typeof CAMERA_PRESETS) => {
    if (controlsRef.current && controlsRef.current.object) {
      const position = CAMERA_PRESETS[preset];
      controlsRef.current.object.position.set(...position);
      controlsRef.current.update();
      setShowCameraPresets(false);
    }
  }, []);

  // Phase 1.7: 360° view export
  const handle360Export = useCallback(async () => {
    if (!controlsRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const originalPosition = controlsRef.current.object.position.clone();
    const images: string[] = [];
    
    try {
      // Capture 36 images (every 10 degrees)
      for (let i = 0; i < 36; i++) {
        const angle = (i * 10) * (Math.PI / 180);
        const radius = 10;
        
        // Position camera in a circle
        controlsRef.current.object.position.set(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );
        controlsRef.current.update();
        
        // Small delay to ensure rendering is complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture image
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            images.push(url);
          }
        }, 'image/png');
      }
      
      // Restore original position
      controlsRef.current.object.position.copy(originalPosition);
      controlsRef.current.update();
      
      // Create download link for the first image (as example)
      // In a full implementation, you'd create a ZIP file with all images
      if (images.length > 0) {
        const link = document.createElement('a');
        link.href = images[0];
        link.download = `${selectedModel.name.replace(/[^a-z0-9]/gi, '_')}_360_frame_01.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up URLs
        images.forEach(url => URL.revokeObjectURL(url));
      }
    } catch (error) {
      console.error('360 export failed:', error);
    }
  }, [selectedModel.name]);

  // Event handlers
  const handleModelClick = () => {
    if (isMobile) {
      setAutoRotate(!autoRotate);
    }
  };

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleZoomFit = () => {
    if (controlsRef.current) {
      controlsRef.current.fitToBox(true);
      controlsRef.current.update();
    }
  };

  const handleModelManager = () => {
    setShowModelSelector(true);
  };

  const handleModelSelect = (model: ModelInfo) => {
    setSelectedModel(model);
    setError(null);
    setRetryCount(prev => prev + 1);
    setShowModelInfo(true);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onResetView: handleResetView,
    onToggleAutoRotate: () => {
      setAutoRotate(!autoRotate);
    },
    onToggleWireframe: () => {
      setIsWireframe(!isWireframe);
    },
    onScreenshot: handleScreenshot,
    onToggleFullscreen: handleFullscreen,
    onZoomFit: handleZoomFit,
    onCameraPresets: () => setShowCameraPresets(!showCameraPresets),
    on360Export: handle360Export,
  });

  // Touch gestures for pinch zoom
  useTouchGestures((delta) => {
    if (controlsRef.current && delta !== 0) {
      const zoomFactor = delta > 0 ? 0.9 : 1.1;
      controlsRef.current.dollyIn(zoomFactor);
      controlsRef.current.update();
    }
  });

  return (
    <div className={`w-full h-full bg-zinc-700 relative ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Model Selector Modal - Phase 1.6 */}
      {showModelSelector && (
        <ModelSelector
          models={AVAILABLE_MODELS}
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
          isMobile={isMobile}
          onClose={() => setShowModelSelector(false)}
        />
      )}

      {error ? (
        // Error state with retry functionality
        <div className="w-full h-full bg-zinc-700">
          <Canvas 
            camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
            performance={{ min: MIN_PERFORMANCE_SCALE }}
            gl={{ preserveDrawingBuffer: true }}
          >
            <ambientLight intensity={0.3} />
            <pointLight position={[15, 15, 15]} intensity={0.8} />
            <pointLight position={[-10, 10, -10]} intensity={0.4} />
            
            <StationaryBackground />
            
            <ResponsiveOrbitControls 
              ref={controlsRef}
              autoRotate={autoRotate} 
              onResetView={handleResetView}
              isMobile={isMobile}
            />
          </Canvas>
          <ErrorMessage error={error} onRetry={handleRetry} isMobile={isMobile} />
        </div>
      ) : (
        // Normal loading and success state
        <React.Suspense fallback={
          <div className="w-full h-full bg-zinc-700">
            <Canvas 
              camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
              performance={{ min: MIN_PERFORMANCE_SCALE }}
              gl={{ preserveDrawingBuffer: true }}
            >
              {/* Skeleton loader is handled in STLModelWrapper */}
            </Canvas>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" 
                 style={{ zIndex: 1000 }}>
              <LoadingSpinner />
            </div>
            <LoadingProgress progress={loadingProgress} />
          </div>
        }>
          <Canvas 
            camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
            key={`canvas-${selectedModel.id}-${retryCount}`}
            performance={{ min: MIN_PERFORMANCE_SCALE }}
            gl={{ preserveDrawingBuffer: true }}
            onCreated={({ gl }) => {
              // Mobile-specific optimizations
              if (isMobile) {
                gl.shadowMap.enabled = false;
                gl.setPixelRatio(Math.min(window.devicePixelRatio, MOBILE_PIXEL_RATIO_MAX));
              } else {
                gl.shadowMap.enabled = true;
                gl.shadowMap.type = THREE.PCFSoftShadowMap;
              }
              
              // Enable frustum culling
              gl.autoClear = true;
            }}
            ref={canvasRef}
            className="dimension-viewer-container"
          >
            <ambientLight intensity={0.3} />
            <pointLight position={[15, 15, 15]} intensity={isMobile ? 0.6 : 0.8} castShadow={!isMobile} />
            <pointLight position={[-10, 10, -10]} intensity={isMobile ? 0.2 : 0.4} castShadow={!isMobile} />
            
            <StationaryBackground />
            
            <STLModelWrapper 
              modelPath={selectedModel.path}
              onError={handleError} 
              autoRotate={autoRotate} 
              onClick={handleModelClick}
              isWireframe={isWireframe}
            />
            
            <ResponsiveOrbitControls 
              ref={controlsRef}
              autoRotate={autoRotate} 
              onResetView={handleResetView}
              isMobile={isMobile}
            />
          </Canvas>
        </React.Suspense>
      )}
      
      {/* Model Info Display - Phase 1.6 */}
      {showModelInfo && !error && (
        <ModelInfoDisplay model={selectedModel} isMobile={isMobile} />
      )}

      {/* Model Info Toggle Button (Mobile) */}
      {isMobile && !error && (
        <button
          onClick={() => setShowModelInfo(!showModelInfo)}
          className="absolute top-4 left-4 bg-gray-900 bg-opacity-80 hover:bg-opacity-100 text-white rounded-full p-3 backdrop-blur-sm transition-all duration-200 shadow-lg z-50"
          title={showModelInfo ? 'Hide Model Info' : 'Show Model Info'}
        >
          {showModelInfo ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      )}

      {/* Camera Preset Selector - Phase 1.7 */}
      {showCameraPresets && (
        <div className="absolute top-16 right-4 bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg p-4 shadow-lg z-50">
          <h3 className="text-white font-semibold mb-3 text-sm">Camera Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CAMERA_PRESETS).map(([name, position]) => (
              <button
                key={name}
                onClick={() => handleCameraPreset(name as keyof typeof CAMERA_PRESETS)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors capitalize"
              >
                {name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCameraPresets(false)}
            className="mt-3 w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
          >
            Close
          </button>
        </div>
      )}
      
      {/* Control Panel Overlay - Updated for Phase 1.7 */}
      <ControlPanel
        autoRotate={autoRotate}
        isWireframe={isWireframe}
        onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
        onToggleWireframe={() => setIsWireframe(!isWireframe)}
        onResetView={handleResetView}
        onZoomFit={handleZoomFit}
        onScreenshot={handleScreenshot}
        onFullscreen={handleFullscreen}
        onCameraPresets={() => setShowCameraPresets(!showCameraPresets)}
        on360Export={handle360Export}
        onModelManager={handleModelManager}
        selectedModelName={selectedModel.name}
        isMobile={isMobile}
        screenSize={screenSize}
      />
      
      {/* Auto-rotate notification for mobile */}
      {isMobile && !autoRotate && (
        <div className="absolute top-20 right-4 bg-blue-600 bg-opacity-90 text-white px-3 py-2 rounded text-sm pointer-events-none"
             style={{ zIndex: 1000 }}>
          Auto-rotation disabled (tap model to enable)
        </div>
      )}
    </div>
  );
}