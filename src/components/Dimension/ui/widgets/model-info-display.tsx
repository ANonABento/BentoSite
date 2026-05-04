import { useState } from 'react';

import type { ModelInfoDisplayProps } from '../../Dimension.types';
import { CollapsibleWidget } from './collapsible-widget';
import { DESIGN_SYSTEM, formatFileSize, formatVertexCount } from '../shared';

export function ModelInfoDisplay({ model, isMobile }: ModelInfoDisplayProps) {
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const [showFileDetails, setShowFileDetails] = useState(false);

  const infoIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <CollapsibleWidget
      title={model.name}
      icon={infoIcon}
      defaultPosition={{ x: 16, y: 16 }}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      isMobile={isMobile}
      className="max-w-sm"
    >
      <div className="space-y-3">
        {/* Category badge */}
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${isMobile ? 'text-xs' : 'text-sm'} bg-[var(--primary-muted)] text-[var(--interactive)] border border-[var(--interactive)] border-opacity-30`}>
          {model.category}
        </span>

        {!isCollapsed && (
          <>
            {/* Description */}
            <p className={`${DESIGN_SYSTEM.colors.text.secondary} leading-relaxed ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {model.description}
            </p>

            {/* File Details section with collapsible toggle and divider */}
            <div className="space-y-2 text-xs">
              <div className="border-t border-[var(--border)] mb-2"></div>
              <button
                onClick={() => setShowFileDetails(!showFileDetails)}
                className="w-full flex items-center justify-between text-xs font-medium transition-colors duration-150 ease-out text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--glass-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--interactive)] focus:ring-opacity-50"
                aria-expanded={showFileDetails}
                aria-label="Toggle file details"
              >
                <span>File Details</span>
                <svg className={`w-3 h-3 transition-transform duration-200 ${showFileDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showFileDetails && (
                <div className="bg-[var(--glass-bg)] rounded-lg p-2 space-y-2">
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
          </>
        )}
      </div>
    </CollapsibleWidget>
  );
}
