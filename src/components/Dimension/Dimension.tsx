'use client';

import type { DimensionViewerProps } from './Dimension.types';

// Import UI components
import {
  ModelInfoDisplay,
  ModelSelector,
  ControlPanel,
} from './Dimension.ui';

import { AVAILABLE_MODELS } from './Dimension.config';
import { DimensionViewport } from './Dimension.viewport';
import { useDimensionController } from './useDimensionController';

const HAS_MULTIPLE_MODELS = AVAILABLE_MODELS.length > 1;

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
      className={`w-full h-full relative ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{ background: 'var(--viewfinder-bg)' }}
      role="region"
      aria-label={`3D model viewer showing ${selectedModel.name}. Keyboard shortcuts: R reset, Space toggle rotation, W wireframe, Z zoom to fit, C camera presets, ${HAS_MULTIPLE_MODELS ? 'M model selector, ' : ''}S screenshot, F fullscreen.`}
      tabIndex={0}
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
        allowScreenshots={!minimal}
      />
      
      {/* Model Info Display */}
      {!minimal && showModelInfo && !error && (
        <ModelInfoDisplay model={selectedModel} isMobile={isMobile} />
      )}

      {/* Model Info Toggle Button (Mobile) */}
      {!minimal && isMobile && !error && (
        <button
          onClick={() => setShowModelInfo(!showModelInfo)}
          className="absolute top-4 left-4 bg-[var(--overlay-strong)] hover:opacity-100 text-[var(--text-on-overlay)] rounded-full p-3 backdrop-blur-sm transition-all duration-200 shadow-lg z-50"
          title={showModelInfo ? 'Hide Model Info' : 'Show Model Info'}
          aria-label={showModelInfo ? 'Hide model information' : 'Show model information'}
          aria-expanded={showModelInfo}
        >
          {showModelInfo ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      )}

      {/* Control Panel Overlay — Camera Presets render as an inline sub-section
          inside this widget when toggled, so positioning is automatic. */}
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
          onCameraPresetSelect={handleCameraPreset}
          onModelManager={handleModelManager}
          enableModelManager={HAS_MULTIPLE_MODELS}
          selectedModelName={selectedModel.name}
          isMobile={isMobile}
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
