// LoadingProgress - Progress bar for model loading with status text
// Extracted from Dimension.ui.tsx for better maintainability

import React, { useState, useEffect } from 'react';

import type { LoadingProgressProps } from '../../Dimension.types';
import { formatPercentage } from '../shared';

export function LoadingProgress({ progress }: LoadingProgressProps) {
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialRender(false), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 glass rounded-xl p-4 pointer-events-none shadow-2xl z-40 ${isInitialRender ? '' : ''}`} role="status" aria-live="polite" aria-label={`Loading progress: ${progress}%`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm text-gray-300 font-medium`}>Loading Model</span>
        <span className={`text-sm text-white font-mono`}>{formatPercentage(progress)}%</span>
      </div>
      <div className="w-64 bg-gray-700 rounded-full h-3 overflow-hidden">
        <div className={`bg-gradient-to-r from-indigo-500 to-violet-500 h-3 rounded-full ${isInitialRender ? '' : 'transition-all duration-300 ease-out'} relative`} style={{ width: `${progress}%` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse"></div>
        </div>
      </div>
      <div className="mt-2 text-xs text-center text-gray-400">
        {progress < 50 ? 'Downloading model files...' : progress < 90 ? 'Processing 3D data...' : 'Almost ready...'}
      </div>
    </div>
  );
}