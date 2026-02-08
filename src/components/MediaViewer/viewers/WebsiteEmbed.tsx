'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import type { WebsiteEmbedProps } from '../MediaViewer.types';

export function WebsiteEmbed({ url, title, onClose }: WebsiteEmbedProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError('Failed to load website. It may have blocked embedding.');
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-[var(--overlay-strong)] backdrop-blur-md flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <h2 className="text-[var(--text-primary)] font-medium truncate max-w-xs">
            {title || 'Live Demo'}
          </h2>
          <span className="text-[var(--text-muted)] text-sm truncate max-w-md hidden md:block">
            {url}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Open in new tab */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg transition-colors"
            title="Open in new tab"
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

      {/* Iframe Content */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-2 border-[var(--interactive)] border-opacity-30 border-t-[var(--interactive)] rounded-full animate-spin" />
            <span className="text-[var(--text-muted)]">Loading website...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
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
              Open in new tab instead
            </a>
          </div>
        )}

        <iframe
          src={url}
          className={`w-full h-full border-0 ${loading ? 'invisible' : 'visible'}`}
          onLoad={handleLoad}
          onError={handleError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title={title || 'Embedded website'}
        />
      </div>
    </motion.div>
  );
}
