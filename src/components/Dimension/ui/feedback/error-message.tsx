// ErrorMessage - Enhanced error display with retry functionality and troubleshooting tips
// Extracted from Dimension.ui.tsx for better maintainability

import React, { useState, useEffect } from 'react';

import type { ErrorMessageProps } from '../../Dimension.types';

export function ErrorMessage({ error, onRetry, isMobile }: ErrorMessageProps) {
  const [isInitialRender, setIsInitialRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialRender(false), 0);
    return () => clearTimeout(timer);
  }, []);

  const getErrorIcon = () => {
    switch (error.code) {
      case 'FILE_NOT_FOUND':
        return (
          <svg className="w-16 h-16 text-[var(--status-error)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'INVALID_FORMAT':
        return (
          <svg className="w-16 h-16 text-[var(--highlight)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getErrorType = () => {
    switch (error.code) {
      case 'FILE_NOT_FOUND': return 'File Not Found';
      case 'INVALID_FORMAT': return 'Invalid File Format';
      default: return 'Loading Error';
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[var(--overlay-strong)] backdrop-blur-md pointer-events-none z-50" role="alert" aria-live="assertive">
      <div className={`glass rounded-xl p-8 text-center pointer-events-auto shadow-2xl ${isInitialRender ? '' : 'transform transition-all duration-200 hover:scale-105'} ${isMobile ? 'mx-6 max-w-sm' : 'max-w-lg mx-4'}`}>
        {getErrorIcon()}
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{getErrorType()}</h3>
        <p className={`text-[var(--text-secondary)] mb-6 text-sm leading-relaxed`}>{error.message}</p>
        <div className="space-y-4">
          {error.retryable && (
            <button
              onClick={onRetry}
              className={`w-full bg-[var(--status-error)] hover:brightness-110 text-[var(--text-on-accent)] font-medium py-3 px-6 rounded-xl ${isInitialRender ? '' : 'transition-all duration-200 flex items-center justify-center space-x-3 transform hover:scale-105'} focus:outline-none focus:ring-2 focus:ring-[var(--status-error)] focus:ring-opacity-50 shadow-lg hover:shadow-xl`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Retry Loading</span>
            </button>
          )}

          <div className={`${isMobile ? 'text-left' : 'text-center'} space-y-2`}>
            <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Troubleshooting Tips:</h4>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-start space-x-2"><span className="text-[var(--interactive)] mt-0.5">•</span><span className="text-[var(--text-muted)]">Check your internet connection</span></div>
              <div className="flex items-start space-x-2"><span className="text-[var(--interactive)] mt-0.5">•</span><span className="text-[var(--text-muted)]">Ensure the model file exists</span></div>
              <div className="flex items-start space-x-2"><span className="text-[var(--interactive)] mt-0.5">•</span><span className="text-[var(--text-muted)]">Verify STL file format</span></div>
              <div className="flex items-start space-x-2"><span className="text-[var(--interactive)] mt-0.5">•</span><span className="text-[var(--text-muted)]">Try selecting a different model</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
