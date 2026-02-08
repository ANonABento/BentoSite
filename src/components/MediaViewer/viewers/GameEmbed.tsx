'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import type { GameEmbedProps } from '../MediaViewer.types';

export function GameEmbed({ type, url, title, onClose }: GameEmbedProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreen) {
          setFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, fullscreen]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError('Failed to load game. It may have blocked embedding.');
  };

  // For itch.io, we need to use their embed URL format
  const embedUrl = type === 'itch' && !url.includes('/embed')
    ? url.replace('itch.io/', 'itch.io/embed/')
    : url;

  return (
    <motion.div
      className={`fixed inset-0 z-50 bg-[var(--surface-deep)] flex flex-col ${fullscreen ? '' : 'p-4 md:p-8'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header - hidden in fullscreen */}
      {!fullscreen && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-[var(--glass-bg)] rounded-t-lg">
          <div className="flex items-center gap-4">
            <h2 className="text-[var(--text-primary)] font-medium truncate max-w-xs">
              {title || (type === 'unity-webgl' ? 'Unity Game' : 'itch.io Game')}
            </h2>
            <span className="text-xs px-2 py-1 bg-[var(--purple-muted)] text-[var(--interactive)] rounded-sm">
              {type === 'unity-webgl' ? 'Unity WebGL' : 'itch.io'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen toggle */}
            <button
              onClick={() => setFullscreen(true)}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg transition-colors"
              title="Fullscreen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>

            {/* Open in new tab */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg transition-colors"
              title="Open on itch.io"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen exit button */}
      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="absolute top-4 right-4 z-10 p-2 bg-[var(--overlay)] text-[var(--text-on-accent)] hover:bg-[var(--overlay-strong)] rounded-lg transition-colors"
          title="Exit fullscreen (Esc)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Game Content */}
      <div className={`flex-1 relative ${fullscreen ? '' : 'rounded-b-lg overflow-hidden'}`}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--background)]">
            <div className="w-12 h-12 border-2 border-[var(--interactive)] border-opacity-30 border-t-[var(--interactive)] rounded-full animate-spin" />
            <span className="text-[var(--text-muted)]">Loading game...</span>
            <p className="text-[var(--text-muted)] text-sm text-center max-w-md px-4">
              {type === 'unity-webgl'
                ? 'Unity WebGL games may take a moment to load. Please wait...'
                : 'Loading itch.io game...'}
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8 bg-[var(--background)]">
            <div className="w-16 h-16 text-[var(--status-warning)]">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-[var(--status-warning)]">{error}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[var(--interactive)] hover:bg-[var(--interactive-hover)] text-[var(--text-on-accent)] rounded-lg transition-colors"
            >
              Play on {type === 'unity-webgl' ? 'original site' : 'itch.io'}
            </a>
          </div>
        )}

        <iframe
          src={embedUrl}
          className={`w-full h-full border-0 bg-[var(--surface-deep)] ${loading ? 'invisible' : 'visible'}`}
          onLoad={handleLoad}
          onError={handleError}
          allow="autoplay; fullscreen; gamepad"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title={title || 'Embedded game'}
        />
      </div>

      {/* Controls hint */}
      {!fullscreen && !loading && !error && (
        <div className="flex-shrink-0 text-center py-2 text-[var(--text-muted)] text-sm">
          Click inside the game to start. Press Esc to exit.
        </div>
      )}
    </motion.div>
  );
}
