// LoadingSpinner - Full-screen loading indicator with enhanced animations
// Extracted from Dimension.ui.tsx for better maintainability

import React, { useState, useEffect } from 'react';

export function LoadingSpinner() {
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialRender(false), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40" role="status" aria-live="polite" aria-label="Loading 3D model">
      <div className={`relative glass rounded-xl p-8 shadow-2xl ${isInitialRender ? '' : 'transform transition-all duration-200 hover:scale-105'}`}>
        <div className="relative">
          <div className="w-16 h-16 border-4 border-violet-200 rounded-full animate-spin border-t-violet-600"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full border-t-violet-400 animate-pulse"></div>
        </div>
        <div className={`mt-4 text-sm text-gray-300 text-center font-medium`}>Loading 3D Model...</div>
        <div className="mt-2 text-xs text-center text-violet-400">Please wait while we prepare your model</div>
      </div>
    </div>
  );
}