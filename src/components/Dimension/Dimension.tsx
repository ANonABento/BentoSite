'use client';

import type { DimensionViewerProps } from './Dimension.types';

// Import UI components
import { 
  ModelInfoDisplay,
  ModelSelector, 
  ControlPanel, 
  CameraPresetsWidget,
} from './Dimension.ui';

import { AVAILABLE_MODELS } from './Dimension.config';
import { DimensionViewport } from './Dimension.viewport';
import { useDimensionController } from './useDimensionController';

export default function DimensionViewer({
  minimal = false,
  modelPath,
}: DimensionViewerProps) {
  const {
    autoRotate,
    canvasRef,
    containerRef,
    controlsRef,
    error,
    handleCameraPreset,
    handleError,
    handleFullscreen,
    handleModelClick,
    handleModelManager,
    handleModelSelect,
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
  } = useDimensionController({ modelPath });

  return (
    <div
      ref={containerRef}
      className={`w-full h-full bg-[var(--surface-deep)] relative ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Model Selector Modal */}
      {showModelSelector && (
        <ModelSelector
          models={AVAILABLE_MODELS}
          selectedModel={selectedModel}
          onModelSelect={handleModelSelect}
          isMobile={isMobile}
          onClose={() => setShowModelSelector(false)}
        />
      )}

      <DimensionViewport
        autoRotate={autoRotate}
        canvasRef={canvasRef}
        controlsRef={controlsRef}
        error={error}
        isMobile={isMobile}
        isWireframe={isWireframe}
        onError={handleError}
        onModelClick={handleModelClick}
        onRetry={handleRetry}
        retryCount={retryCount}
        rotationSpeed={rotationSpeed}
        selectedModel={selectedModel}
        zoomLevel={zoomLevel}
        onZoomLevelChange={handleZoomChange}
      />
      
      {/* Model Info Display */}
      {!minimal && showModelInfo && !error && (
        <ModelInfoDisplay model={selectedModel} isMobile={isMobile} />
      )}

      {/* Model Info Toggle Button (Mobile) */}
      {!minimal && isMobile && !error && (
        <button
          onClick={() => setShowModelInfo(!showModelInfo)}
          className="absolute top-4 left-4 bg-[var(--overlay-strong)] hover:opacity-100 text-[var(--text-on-accent)] rounded-full p-3 backdrop-blur-sm transition-all duration-200 shadow-lg z-50"
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

      {/* Camera Presets Widget - Auto-positioned directly under the control widget */}
      {!minimal && showCameraPresets && (
        <CameraPresetsWidget
          presets={{
            front: [0, 0, 10],
            back: [0, 0, -10],
            left: [-10, 0, 0],
            right: [10, 0, 0],
            top: [0, 10, 0],
            bottom: [0, -10, 0],
            isometric: [8, 8, 8],
            reset: [0, 2, 8],
          }}
          onPresetSelect={handleCameraPreset}
          onClose={() => setShowCameraPresets(false)}
          autoPosition
          isMobile={isMobile}
        />
      )}
      
      {/* Control Panel Overlay */}
      {!minimal && (
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
          onModelManager={handleModelManager}
          selectedModelName={selectedModel.name}
          isMobile={isMobile}
          screenSize={screenSize}
          showCameraPresets={showCameraPresets}
          zoomLevel={zoomLevel}
          rotationSpeed={rotationSpeed}
          onZoomChange={handleZoomChange}
          onRotationSpeedChange={handleRotationSpeedChange}
        />
      )}

      {/* Auto-rotate notification for mobile */}
      {!minimal && isMobile && !autoRotate && (
        <div className="absolute top-20 right-4 bg-[var(--status-info)] text-[var(--text-on-accent)] px-3 py-2 rounded text-sm pointer-events-none"
             style={{ zIndex: 1000 }}>
          Auto-rotation disabled (tap model to enable)
        </div>
      )}
    </div>
  );
}
