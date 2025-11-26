// Dimension.tsx - UI Components

import React, { useState, useRef, useEffect } from 'react';
import type {
  ControlPanelProps,
  ModelSelectorProps,
  ModelInfoDisplayProps,
  LoadingProgressProps,
  ErrorMessageProps,
  KeyboardShortcutsHelpProps,
  PerformanceHUDProps,
  CollapsibleWidgetProps
} from './Dimension.types';

// Import utilities
import { formatFileSize, formatVertexCount, formatPercentage } from './Dimension.utils';

// Collapsible Widget Component with draggable functionality
export function CollapsibleWidget({
  title,
  icon,
  defaultPosition,
  isCollapsed,
  onToggleCollapse,
  children,
  className = '',
  isMobile,
  autoPosition = false
}: CollapsibleWidgetProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartTime, setDragStartTime] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const [containerBounds, setContainerBounds] = useState({ width: 0, height: 0 });

  // Update container bounds on mount and resize
  useEffect(() => {
    const updateBounds = () => {
      if (widgetRef.current?.parentElement) {
        const rect = widgetRef.current.parentElement.getBoundingClientRect();
        setContainerBounds({ width: rect.width, height: rect.height });
      }
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  // Auto-position widget in top-right corner of container when autoPosition is enabled
  useEffect(() => {
    if (autoPosition && containerBounds.width > 0) {
      const widgetWidth = isMobile ? 192 : 288; // w-48 or w-72
      const margin = isMobile ? 16 : 20;
      const newX = Math.max(0, containerBounds.width - widgetWidth - margin);
      setPosition(prev => ({ ...prev, x: newX, y: margin }));
    }
  }, [autoPosition, containerBounds.width, containerBounds.height, isMobile]);

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('DEBUG: handleMouseDown called, isCollapsed:', isCollapsed, 'target:', e.target);
    
    // Don't start drag if clicking on interactive elements inside the widget
    const target = e.target as HTMLElement;
    const interactiveElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    const isInteractiveElement = interactiveElements.includes(target.tagName) || 
                                target.closest('button, a, input, select, textarea');
    
    if (isInteractiveElement) {
      return; // Let the interactive element handle its own click
    }
    
    // Always allow dragging from anywhere else on the widget
    setIsDragging(true);
    setDragStartTime(Date.now());
    setHasMoved(false);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !widgetRef.current) return;

    setHasMoved(true);
    const containerRect = widgetRef.current.parentElement?.getBoundingClientRect();
    if (!containerRect) return;

    // Allow widgets to be dragged anywhere within container bounds
    const newX = Math.max(0, Math.min(
      e.clientX - containerRect.left - dragOffset.x,
      containerBounds.width - (widgetRef.current.offsetWidth || 280)
    ));

    const newY = Math.max(0, Math.min(
      e.clientY - containerRect.top - dragOffset.y,
      containerBounds.height - (widgetRef.current.offsetHeight || 200)
    ));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = (e: MouseEvent) => {
    const dragDuration = Date.now() - dragStartTime;
    
    // Check if the mouse up event originated from the header area
    const target = e.target as HTMLElement;
    const isHeaderClick = target.closest('.widget-header');
    
    // Don't trigger toggle if mouse up was on an interactive element
    const interactiveElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    const isInteractiveElement = interactiveElements.includes(target.tagName) || 
                                target.closest('button, a, input, select, textarea');
    
    // Only toggle if it was a quick click (under 200ms) with no movement AND on header AND not on interactive element
    if (dragDuration < 200 && !hasMoved && isHeaderClick && !isInteractiveElement) {
      console.log('DEBUG: handleMouseUp triggering toggle');
      onToggleCollapse();
    }
    
    // Clean up dragging state
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, containerBounds, hasMoved]);

  return (
    <div
      ref={widgetRef}
      className={`absolute z-50 select-none ${className}`}
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : (isCollapsed ? 'pointer' : 'grab')
      }}
    >
      <div
        className={`bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg transition-all duration-200 ${
            isMobile ? 'w-48' : 'w-72'
        } ${isCollapsed ? 'h-12' : ''}`}
        onMouseDown={handleMouseDown}
      >
        {/* Header - Now fully clickable for collapse/expand */}
        <div
          className="widget-header flex items-center justify-between p-3 border-b border-gray-700 cursor-pointer"
        >
          {/* Left side: Icon and Title - Both clickable */}
          <div className="flex items-center space-x-2">
            <div className="text-blue-400">
              {icon}
            </div>
            <h3 className="font-semibold text-white text-sm hover:text-blue-300 transition-colors">
              {title}
            </h3>
          </div>

          {/* Right side: Toggle button (^) - Clickable */}
          <button
            className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-gray-700"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="p-3 text-white">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Model Info Display Component
export function ModelInfoDisplay({ model, isMobile }: ModelInfoDisplayProps) {
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const [showPerformance, setShowPerformance] = useState(false);

  const infoIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <CollapsibleWidget
      title="Info"
      icon={infoIcon}
      defaultPosition={{ x: 16, y: 16 }}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      isMobile={isMobile}
      className="max-w-sm"
    >
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-lg text-blue-300">{model.name}</h4>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>
            {model.category}
          </span>
        </div>

        {!isCollapsed && (
          <>
            <p className={`text-gray-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {model.description}
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">File Size:</span>
                <span className="text-white">{formatFileSize(model.fileSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Dimensions:</span>
                <span className="text-white">
                  {model.dimensions.width} × {model.dimensions.height} × {model.dimensions.depth}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Vertices:</span>
                <span className="text-white">{formatVertexCount(model.vertexCount)}</span>
              </div>
            </div>

            {/* Performance Section */}
            <div className="pt-2 border-t border-gray-700">
              <button
                onClick={() => setShowPerformance(!showPerformance)}
                className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-white transition-colors"
              >
                <span>Performance</span>
                <svg className={`w-3 h-3 transition-transform duration-200 ${showPerformance ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPerformance && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">FPS:</span>
                    <span className="text-white">60</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Render Time:</span>
                    <span className="text-white">16.7ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory:</span>
                    <span className="text-white">45.2MB</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </CollapsibleWidget>
  );
}

// Model Selector Dropdown Component (unchanged)
export function ModelSelector({ models, selectedModel, onModelSelect, isMobile, onClose }: ModelSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(models.map((model: any) => model.category)))];

  // Filter models based on search and category
  const filteredModels = models.filter((model: any) => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          model.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || model.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleModelClick = (model: any) => {
    onModelSelect(model);
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 2000 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-lg shadow-xl max-h-[80vh] overflow-hidden ${isMobile ? 'w-full max-w-sm' : 'w-full max-w-2xl'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Select Model</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category: string) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Model Grid */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {filteredModels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No models found matching your criteria.
            </div>
          ) : (
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
              {filteredModels.map((model: any) => (
                <div
                  key={model.id}
                  onClick={() => handleModelClick(model)}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedModel.id === model.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Thumbnail placeholder */}
                  <div className="w-full h-24 bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{model.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{model.description}</p>

                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium`}>
                      {model.category}
                    </span>
                    <span className="text-xs text-gray-500">{formatFileSize(model.fileSize)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Control Panel with prioritized controls
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
  on360Export,
  onModelManager,
  selectedModelName,
  isMobile,
  screenSize
}: ControlPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const [showSecondaryControls, setShowSecondaryControls] = useState(false);

  React.useEffect(() => {
    // Auto-collapse on mobile
    setIsCollapsed(isMobile);
  }, [isMobile]);

  // Essential controls - always visible when not collapsed
  const essentialControls = [
    {
      icon: autoRotate ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: autoRotate ? 'Pause (Space)' : 'Auto (Space)',
      onClick: onToggleAutoRotate,
      active: autoRotate,
      shortcut: 'Space'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      label: 'Reset (R)',
      onClick: onResetView,
      active: false,
      shortcut: 'R'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      ),
      label: 'Fit (Z)',
      onClick: onZoomFit,
      active: false,
      shortcut: 'Z'
    },
    {
      icon: isWireframe ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      label: isWireframe ? 'Solid (W)' : 'Wire (W)',
      onClick: onToggleWireframe,
      active: isWireframe,
      shortcut: 'W'
    }
  ];

  // Secondary controls - collapsible
  const secondaryControls = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      label: 'Camera (C)',
      onClick: onCameraPresets,
      active: false,
      shortcut: 'C'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Shot (S)',
      onClick: onScreenshot,
      active: false,
      shortcut: 'S'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      ),
      label: 'Full (F)',
      onClick: onFullscreen,
      active: false,
      shortcut: 'F'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      label: '360° (E)',
      onClick: on360Export,
      active: false,
      shortcut: 'E'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      label: 'Models (M)',
      onClick: onModelManager,
      active: false,
      shortcut: 'M'
    }
  ];

  const controlsIcon = (
    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
    </svg>
  );

  // Simple default position for controls (will be overridden by autoPosition)
  const getDefaultPosition = () => {
    return { x: 0, y: 0 }; // Will be overridden by autoPosition logic
  };

  return (
    <CollapsibleWidget
      title="Controls"
      icon={controlsIcon}
      defaultPosition={getDefaultPosition()}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      isMobile={isMobile}
      autoPosition={true}
    >
      <div className="space-y-3">
        {/* Essential Controls */}
        <div className="grid grid-cols-2 gap-2">
          {essentialControls.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className={`p-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                button.active
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
              }`}
              title={`${button.label} (${button.shortcut})`}
            >
              <div className="flex items-center space-x-1">
                {button.icon}
                {!isMobile && (
                  <span className="text-xs font-medium">{button.label}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Secondary Controls Toggle */}
        <button
          onClick={() => setShowSecondaryControls(!showSecondaryControls)}
          className="w-full p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg flex items-center justify-center transition-all duration-200"
        >
          <svg className={`w-4 h-4 mr-2 transition-transform duration-200 ${showSecondaryControls ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-xs">More ({secondaryControls.length})</span>
        </button>

        {/* Secondary Controls */}
        {showSecondaryControls && (
          <div className="grid grid-cols-2 gap-2">
            {secondaryControls.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                className={`p-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  button.active
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'
                }`}
                title={`${button.label} (${button.shortcut})`}
              >
                <div className="flex items-center space-x-1">
                {button.icon}
                {!isMobile && (
                  <span className="text-xs font-medium">{button.label}</span>
                )}
              </div>
              </button>
            ))}
          </div>
        )}

        {/* Model Name Display */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-gray-700">
            <div className="text-xs text-gray-400 truncate">
              Model: {selectedModelName}
            </div>
          </div>
        )}
      </div>
    </CollapsibleWidget>
  );
}

// Loading Components (updated for better positioning)
export function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 1000 }}>
      <div className="relative bg-gray-900 bg-opacity-90 rounded-lg p-6">
        <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
        <div className="mt-2 text-sm text-gray-300 text-center">Loading Model...</div>
      </div>
    </div>
  );
}

export function LoadingProgress({ progress }: LoadingProgressProps) {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-90 rounded-lg p-4 pointer-events-none"
          style={{ zIndex: 1000, maxWidth: '300px' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">Loading Model</span>
        <span className="text-sm text-gray-300">{formatPercentage(progress)}%</span>
      </div>
      <div className="w-full bg-gray-600 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

// Keyboard Shortcuts Help (updated positioning)
export function KeyboardShortcutsHelp({ isVisible }: KeyboardShortcutsHelpProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-white p-4 rounded-lg text-sm pointer-events-none"
          style={{ zIndex: 1000, maxWidth: '300px' }}>
      <h4 className="font-semibold mb-2 text-center">Keyboard Shortcuts</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><kbd className="bg-gray-700 px-1 rounded">R</kbd> Reset View</div>
        <div><kbd className="bg-gray-700 px-1 rounded">Space</kbd> Auto Rotate</div>
        <div><kbd className="bg-gray-700 px-1 rounded">W</kbd> Wireframe</div>
        <div><kbd className="bg-gray-700 px-1 rounded">Z</kbd> Zoom Fit</div>
        <div><kbd className="bg-gray-700 px-1 rounded">S</kbd> Screenshot</div>
        <div><kbd className="bg-gray-700 px-1 rounded">F</kbd> Fullscreen</div>
        <div><kbd className="bg-gray-700 px-1 rounded">E</kbd> 360 Export</div>
        <div><kbd className="bg-gray-700 px-1 rounded">M</kbd> Models</div>
      </div>
      <div className="mt-2 text-gray-400 text-xs text-center">Press ? to hide</div>
    </div>
  );
}

// Performance HUD (simplified - no text prompts)
export function PerformanceHUD({ isMobile }: PerformanceHUDProps) {
  return null; // Removed the text prompts as requested
}

// Error Handling Components (updated positioning)
export function ErrorMessage({ error, onRetry, isMobile }: ErrorMessageProps) {
  const getErrorIcon = () => {
    switch (error.code) {
      case 'FILE_NOT_FOUND':
        return (
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'INVALID_FORMAT':
        return (
          <svg className="w-12 h-12 text-orange-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 pointer-events-none"
          style={{ zIndex: 999 }}>
      <div className={`bg-gray-900 bg-opacity-90 rounded-lg p-6 text-center border border-gray-700 pointer-events-auto ${
        isMobile ? 'mx-4 max-w-sm' : 'max-w-md mx-4'
      }`}>
        {getErrorIcon()}
        <h3 className="text-lg font-semibold text-white mb-3">Model Loading Error</h3>
        <p className="text-gray-300 mb-4 text-sm">{error.message}</p>
        <div className="space-y-3">
          {error.retryable && (
            <button
              onClick={onRetry}
              className={`w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 ${
                isMobile ? 'text-sm' : ''
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Retry Loading</span>
            </button>
          )}
          <div className={`text-xs text-gray-400 space-y-1 ${isMobile ? 'text-left' : ''}`}>
            <p>• Check your internet connection</p>
            <p>• Ensure the model file exists</p>
            <p>• Verify STL file format</p>
            <p>• Try selecting a different model</p>
          </div>
        </div>
      </div>
    </div>
  );
}