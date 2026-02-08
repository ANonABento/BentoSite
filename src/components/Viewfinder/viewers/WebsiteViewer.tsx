'use client';

import { useState } from 'react';
import type { WebsiteViewerProps } from '../Viewfinder.types';

export function WebsiteViewer({ url }: WebsiteViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!url) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
        No website available
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* URL bar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--glass-bg)]">
        <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span className="flex-1 text-sm text-[var(--text-secondary)] truncate">{url}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded hover:bg-[var(--glass-bg)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Open in new tab"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* iframe */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)] z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[var(--interactive)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--text-muted)]">Loading website...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--background)] z-10">
            <svg className="w-12 h-12 text-[var(--text-muted)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-[var(--text-secondary)] mb-2">This site cannot be embedded</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[var(--interactive)] text-[var(--text-on-accent)] rounded-lg hover:bg-[var(--interactive-hover)] transition-colors"
            >
              Open in new tab
            </a>
          </div>
        )}

        <iframe
          src={url}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError(true);
            setIsLoading(false);
          }}
          title="Embedded website"
        />
      </div>
    </div>
  );
}
