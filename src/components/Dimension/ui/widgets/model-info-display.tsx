// ModelInfoDisplay - Shows detailed information about the current 3D model
// Extracted from Dimension.ui.tsx for better maintainability

import React, { useState } from 'react';

import type { ModelInfoDisplayProps } from '../../Dimension.types';
import { CollapsibleWidget } from './collapsible-widget';
import { DESIGN_SYSTEM, formatFileSize, formatVertexCount } from '../shared';

export function ModelInfoDisplay({ model, isMobile }: ModelInfoDisplayProps) {
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);

  const infoIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <CollapsibleWidget
      title="Model Info"
      icon={infoIcon}
      defaultPosition={{ x: 16, y: 16 }}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      isMobile={isMobile}
      className="max-w-sm"
    >
      <div className="space-y-3">
        {/* Model header */}
        <div className="space-y-1">
          <h4 className="font-bold text-lg text-blue-300 leading-tight">{model.name}</h4>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${isMobile ? 'text-xs' : 'text-sm'} bg-blue-100 text-blue-800 border border-blue-200`}>
            {model.category}
          </span>
        </div>

        {!isCollapsed && (
          <React.Fragment>
            {/* Description */}
            <p className={`${DESIGN_SYSTEM.colors.text.secondary} leading-relaxed ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {model.description}
            </p>

            {/* File Details section with collapsible toggle and divider */}
            <div className="space-y-2 text-xs">
              <div className="border-t border-gray-600/50 mb-2"></div>
              <button
                onClick={() => setShowFileDetails(!showFileDetails)}
                className={`w-full flex items-center justify-between text-xs font-medium transition-colors duration-150 ease-out ${DESIGN_SYSTEM.colors.text.tertiary} hover:${DESIGN_SYSTEM.colors.text.primary} p-1 rounded-lg hover:bg-gray-800/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                aria-expanded={showFileDetails}
                aria-label="Toggle file details"
              >
                <span>File Details</span>
                <svg className={`w-3 h-3 transition-transform duration-200 ${showFileDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showFileDetails && (
                <div className="bg-gray-800/50 rounded-lg p-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`${DESIGN_SYSTEM.colors.text.tertiary} font-medium`}>File Size:</span>
                    <span className={`${DESIGN_SYSTEM.colors.text.primary} font-mono text-xs`}>{formatFileSize(model.fileSize)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${DESIGN_SYSTEM.colors.text.tertiary} font-medium`}>Dimensions:</span>
                    <span className={`${DESIGN_SYSTEM.colors.text.primary} font-mono text-xs`}>
                      {model.dimensions.width} × {model.dimensions.height} × {model.dimensions.depth}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${DESIGN_SYSTEM.colors.text.tertiary} font-medium`}>Vertices:</span>
                    <span className={`${DESIGN_SYSTEM.colors.text.primary} font-mono text-xs`}>{formatVertexCount(model.vertexCount)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Performance section with visual divider - reduced top padding */}
            <div>
              <div className="border-t border-gray-600/50 mb-2"></div>
              <button
                onClick={() => setShowPerformance(!showPerformance)}
                className={`w-full flex items-center justify-between text-xs font-medium transition-colors duration-150 ease-out ${DESIGN_SYSTEM.colors.text.tertiary} hover:${DESIGN_SYSTEM.colors.text.primary} p-1 rounded-lg hover:bg-gray-800/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                aria-expanded={showPerformance}
                aria-label="Toggle performance metrics"
              >
                <span>Performance Metrics</span>
                <svg className={`w-3 h-3 transition-transform duration-200 ${showPerformance ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPerformance && (
                <div className="mt-2 space-y-2 bg-gray-800/30 rounded-lg p-2">
                  <div className="flex justify-between items-center">
                    <span className={`${DESIGN_SYSTEM.colors.text.tertiary} text-xs`}>FPS:</span>
                    <span className="text-green-400 font-mono text-xs">60</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${DESIGN_SYSTEM.colors.text.tertiary} text-xs`}>Render Time:</span>
                    <span className="text-blue-400 font-mono text-xs">16.7ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`${DESIGN_SYSTEM.colors.text.tertiary} text-xs`}>Memory:</span>
                    <span className="text-yellow-400 font-mono text-xs">45.2MB</span>
                  </div>
                </div>
              )}
            </div>
          </React.Fragment>
        )}
      </div>
    </CollapsibleWidget>
  );
}