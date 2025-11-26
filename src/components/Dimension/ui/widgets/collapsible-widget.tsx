// CollapsibleWidget - Base draggable, collapsible widget component
// Extracted from Dimension.ui.tsx for reusability

import React, { useState, useRef, useEffect, useCallback } from 'react';

import type { CollapsibleWidgetProps } from '../../Dimension.types';
import { DESIGN_SYSTEM } from '../shared/design-system';

export function CollapsibleWidget({
  title,
  icon,
  defaultPosition,
  isCollapsed,
  onToggleCollapse,
  onClose,
  children,
  className = '',
  isMobile,
  autoPosition = false
}: CollapsibleWidgetProps & { onClose?: () => void }) {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [containerBounds, setContainerBounds] = useState({ width: 0, height: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // No initial animation - widgets spawn in place immediately
  // Removed useEffect that was setting isInitialRender

  // Track container bounds for auto-positioning
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

  // Auto-position widget in top-right corner of container when autoPosition is enabled
  useEffect(() => {
    if (autoPosition && containerBounds.width > 0) {
      const widgetWidth = isMobile ? 192 : 288; // w-48 or w-72
      const margin = isMobile ? 16 : 20;
      const newX = Math.max(0, containerBounds.width - widgetWidth - margin);
      setPosition(prev => ({ ...prev, x: newX, y: margin }));
    }
  }, [autoPosition, containerBounds.width, containerBounds.height, isMobile]);

  // Enhanced mouse event handlers with better accessibility
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const interactiveElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    const isInteractiveElement = interactiveElements.includes(target.tagName) || 
                                target.closest('button, a, input, select, textarea');
    
    if (isInteractiveElement) return;
    
    setIsDragging(true);
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
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !widgetRef.current) return;

    setHasMoved(true);
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

    setPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const isHeaderClick = target.closest('.widget-header');
    
    const interactiveElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    const isInteractiveElement = interactiveElements.includes(target.tagName) || 
                                target.closest('button, a, input, select, textarea');
    
    // Smooth dragging without delays
    if (!hasMoved && isHeaderClick && !isInteractiveElement) {
      onToggleCollapse();
    }
    
    setIsDragging(false);
  }, [hasMoved, onToggleCollapse]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggleCollapse();
    }
  }, [onToggleCollapse]);

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
      className={`
        absolute select-none
        ${isDragging ? 'scale-105 shadow-2xl' : 'shadow-lg'}
        ${className}
      `}
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : (isCollapsed ? 'pointer' : 'grab'),
        transition: 'none' // Remove all transitions for immediate response
      }}
      role="complementary"
      aria-label={`${title} control panel`}
    >
      <div
        className={`
          backdrop-blur-sm rounded-xl border border-opacity-20
          ${DESIGN_SYSTEM.colors.bg.primary} ${DESIGN_SYSTEM.colors.border.secondary}
          ${isMobile ? 'w-48' : 'w-72'} 
          ${isCollapsed ? 'h-12' : ''}
          ${isDragging ? 'ring-2 ring-blue-400/50' : ''}
        `}
        onMouseDown={handleMouseDown}
      >
        {/* Header with toggle button only */}
        <div
          className={`
            widget-header flex items-center justify-between px-4 py-3 border-b border-gray-700/50
            cursor-pointer
            hover:bg-gray-700/30 focus-within:bg-gray-700/30
            ${isKeyboardFocused ? 'ring-2 ring-blue-500/50 ring-inset' : ''}
          `}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsKeyboardFocused(true)}
          onBlur={() => setIsKeyboardFocused(false)}
          tabIndex={0}
          role="button"
          aria-expanded={!isCollapsed}
          aria-label={`Toggle ${title} panel`}
        >
          <div className="flex items-center space-x-2">
            <div className={`text-blue-400 hover:text-blue-300`}>
              {icon}
            </div>
            <h3 className={`font-semibold text-sm ${DESIGN_SYSTEM.colors.text.primary} hover:text-blue-300`}>
              {title}
            </h3>
          </div>

          <button
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-95 transform"
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            aria-label={isCollapsed ? `Expand ${title} panel` : `Collapse ${title} panel`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
          >
            <svg className={`w-4 h-4 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className={`${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.colors.text.primary}`}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}