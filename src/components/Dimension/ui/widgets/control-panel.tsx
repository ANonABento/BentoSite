// ControlPanel - Main control interface for 3D viewer operations
// Extracted from Dimension.ui.tsx for better maintainability

import React, { useState, useMemo } from 'react';
import { m } from 'framer-motion';

import type { ControlPanelProps } from '../../Dimension.types';
import { CollapsibleWidget } from './collapsible-widget';
import { buttonTap } from '@/lib/animations';

export function ControlPanel({
  autoRotate,
  isWireframe,
  onToggleAutoRotate,
  onToggleWireframe,
  onResetView,
  onZoomFit,
  onScreenshot,
  onFullscreen,
  onCameraPresets,
  onModelManager,
  isMobile,
  showCameraPresets,
  zoomLevel,
  rotationSpeed,
  onZoomChange,
  onRotationSpeedChange
}: ControlPanelProps & { showCameraPresets?: boolean }) {
  const [isCollapsed, setIsCollapsed] = useState(isMobile);

  React.useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);

  // Control button definitions - memoized to prevent recreation on every render
  const allControls = useMemo(() => [
    {
      icon: autoRotate ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: autoRotate ? 'Pause' : 'Auto',
      onClick: onToggleAutoRotate,
      active: autoRotate,
      shortcut: 'Space',
      description: autoRotate ? 'Stop automatic rotation' : 'Start automatic rotation'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      label: 'Reset',
      onClick: onResetView,
      active: false,
      shortcut: 'R',
      description: 'Reset camera to default position'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      ),
      label: 'Fit',
      onClick: onZoomFit,
      active: false,
      shortcut: 'Z',
      description: 'Fit model to screen'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      ),
      label: 'Full',
      onClick: onFullscreen,
      active: false,
      shortcut: 'F',
      description: 'Toggle fullscreen mode'
    },
    {
      icon: isWireframe ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      label: isWireframe ? 'Solid' : 'Wire',
      onClick: onToggleWireframe,
      active: isWireframe,
      shortcut: 'W',
      description: isWireframe ? 'Switch to solid view' : 'Switch to wireframe view'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      ),
      label: 'Presets',
      onClick: onCameraPresets,
      active: showCameraPresets || false, // This ensures the button shows as blue when camera presets are open
      shortcut: 'C',
      description: 'Open camera presets'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Shot',
      onClick: onScreenshot,
      active: false,
      shortcut: 'S',
      description: 'Capture screenshot of current view'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      label: 'Models',
      onClick: onModelManager,
      active: false,
      shortcut: 'M',
      description: 'Open model manager'
    }
  ], [autoRotate, isWireframe, showCameraPresets, onToggleAutoRotate, onResetView, onZoomFit, onFullscreen, onToggleWireframe, onCameraPresets, onScreenshot, onModelManager]);

  const controlsIcon = (
    <svg className="w-4 h-4 text-[var(--interactive)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
    </svg>
  );

  return (
    <CollapsibleWidget
      title="Controls"
      icon={controlsIcon}
      defaultPosition={{ x: 600, y: 16 }}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      isMobile={isMobile}
      autoPosition={true}
    >
      <div className="space-y-4">
        {!isCollapsed && (
          <>
            <div className="grid grid-cols-4 gap-2">
              {allControls.map((button, index) => (
                <m.button
                  key={index}
                  onClick={button.onClick}
                  whileTap={buttonTap}
                  className={`
                    p-2 rounded-sm flex flex-col items-center justify-center
                    focus:outline-none focus:ring-2 focus:ring-[var(--interactive)] focus:ring-opacity-50
                    min-h-[60px] transition-all duration-200
                    ${button.active
                      ? 'bg-[var(--orange)] text-[var(--text-on-accent)] shadow-lg shadow-[var(--orange-muted)] ring-1 ring-[var(--orange)] ring-opacity-30'
                      : 'bg-[var(--glass-bg)] backdrop-blur border border-[var(--border)] hover:bg-[var(--glass-bg-strong)] hover:border-[var(--purple)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }
                  `}
                  title={`${button.label} (${button.shortcut}) - ${button.description}`}
                  aria-label={`${button.label}: ${button.description}`}
                  aria-pressed={button.active}
                >
                  <div className="mb-1">{button.icon}</div>
                  <div className="text-xs font-medium text-center leading-tight">{button.label}</div>
                  <div className="text-xs opacity-70 mt-1">{button.shortcut}</div>
                </m.button>
              ))}
            </div>

            {/* Sliders Section */}
            <div className="border-t border-[var(--border)] pt-3 space-y-3">
              {/* Zoom Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-muted)]">Zoom</span>
                  <span className="text-[var(--text-secondary)] font-mono">{Math.round(zoomLevel)}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="40"
                  step="1"
                  value={zoomLevel}
                  onChange={(e) => onZoomChange(Number(e.target.value))}
                  className="w-full h-2 bg-[var(--glass-bg-strong)] rounded-lg appearance-none cursor-pointer accent-[var(--purple)]"
                  aria-label="Zoom level"
                  aria-valuetext={`${Math.round(zoomLevel)} units`}
                />
              </div>

              {/* Rotation Speed Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-muted)]">Speed</span>
                  <span className="text-[var(--text-secondary)] font-mono">{rotationSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={rotationSpeed}
                  onChange={(e) => onRotationSpeedChange(Number(e.target.value))}
                  className="w-full h-2 bg-[var(--glass-bg-strong)] rounded-lg appearance-none cursor-pointer accent-[var(--purple)]"
                  aria-label="Rotation speed"
                  aria-valuetext={`${rotationSpeed.toFixed(1)} times`}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </CollapsibleWidget>
  );
}
