// CameraPresetsWidget - Draggable widget for camera preset selection
// Extracted from Dimension.ui.tsx for better maintainability

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

import type { CameraPresetsWidgetProps } from '../../Dimension.types';

export function CameraPresetsWidget({
  presets,
  onPresetSelect,
  onClose,
  defaultPosition,
  isMobile,
  autoPosition = true
}: CameraPresetsWidgetProps) {
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [containerBounds, setContainerBounds] = useState({ width: 0, height: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Track container bounds for auto-positioning (similar to collapsible-widget)
  useEffect(() => {
    const updateContainerBounds = () => {
      const container = widgetRef.current?.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        setContainerBounds({ width: rect.width, height: rect.height });
      }
    };

    // Update on mount and resize
    updateContainerBounds();
    window.addEventListener('resize', updateContainerBounds);

    // Use ResizeObserver for more precise tracking
    const container = widgetRef.current?.parentElement;
    if (container && 'ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(updateContainerBounds);
      resizeObserver.observe(container);
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateContainerBounds);
      };
    }

    return () => window.removeEventListener('resize', updateContainerBounds);
  }, []);

  // Compute position: use drag position if dragged, otherwise auto-position or default
  const position = useMemo(() => {
    if (dragPosition) return dragPosition;

    if (autoPosition && containerBounds.width > 0) {
      const widgetWidth = isMobile ? 192 : 288; // w-48 or w-72
      const margin = isMobile ? 16 : 20;
      const controlsY = margin; // Controls widget y position
      const controlsHeight = 48; // Controls widget height when collapsed (h-12)
      const gap = 180; // Gap between widgets

      // Position to the right side, same as controls widget
      const x = Math.max(0, containerBounds.width - widgetWidth - margin);
      // Position directly under controls widget
      const y = controlsY + controlsHeight + gap;

      return { x, y };
    }

    return defaultPosition || { x: 0, y: 0 };
  }, [dragPosition, autoPosition, containerBounds.width, isMobile, defaultPosition]);

  const cameraIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
    </svg>
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.tagName === 'BUTTON' || target.closest('button');
    
    if (isInteractiveElement) return;
    
    setIsDragging(true);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !widgetRef.current) return;

    const containerRect = widgetRef.current.parentElement?.getBoundingClientRect();
    if (!containerRect) return;

    const newX = Math.max(0, Math.min(
      e.clientX - containerRect.left - dragOffset.x,
      containerRect.width - (widgetRef.current.offsetWidth || 280)
    ));

    const newY = Math.max(0, Math.min(
      e.clientY - containerRect.top - dragOffset.y,
      containerRect.height - (widgetRef.current.offsetHeight || 200)
    ));

    setDragPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={widgetRef}
      className={`absolute select-none z-[55] shadow-2xl`}
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'none' // Remove all transitions for immediate response
      }}
      role="dialog"
      aria-label="Camera Presets"
      onMouseDown={handleMouseDown}
    >
      <div className={`
        glass rounded-2xl
        ${isMobile ? 'w-48' : 'w-72'}
        shadow-lg border border-violet-500/20
      `}>
        {/* Header with drag hint and close button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            {/* Drag handle hint */}
            <div className="flex flex-col gap-0.5 mr-1 opacity-40">
              <div className="w-4 h-0.5 bg-gray-400 rounded" />
              <div className="w-4 h-0.5 bg-gray-400 rounded" />
            </div>
            <div className="text-violet-400">{cameraIcon}</div>
            <h3 className="font-semibold text-sm text-white">Camera Presets</h3>
          </div>
          <button
            className="text-gray-400 hover:text-red-400 p-1 rounded-sm hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-red-500/50 active:scale-95 transform transition-colors"
            title="Close presets"
            aria-label="Close camera presets"
            onClick={onClose}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preset buttons grid */}
        <div className={`p-3 text-white`}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(presets).map(([name]) => (
                <button
                  key={name}
                  onClick={() => onPresetSelect(name as keyof typeof presets)}
                  className="px-3 py-2 text-xs rounded-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-500/50 bg-white/5 border border-white/10 hover:bg-violet-500/20 hover:border-violet-500/30 text-gray-300 hover:text-white"
                >
                  <div className="capitalize font-medium">{name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}