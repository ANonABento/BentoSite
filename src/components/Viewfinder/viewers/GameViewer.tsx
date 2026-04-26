'use client';

import { useMemo, useState } from 'react';
import type { GameViewerProps } from '../Viewfinder.types';

function canEmbedGame(game: NonNullable<GameViewerProps['game']>): boolean {
  if (game.type === 'itch') {
    return game.url.includes('/embed/');
  }

  return true;
}

export function GameViewer({ game }: GameViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const embedUrl = useMemo(() => {
    if (!game) return null;
    return game.url;
  }, [game]);
  const loadKey = game ? `${game.type}:${game.url}` : null;
  const isLoading = Boolean(loadKey && embedUrl && loadedKey !== loadKey);

  if (!game || !embedUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        <p>No game available</p>
      </div>
    );
  }

  if (!canEmbedGame(game)) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--surface-deep)] text-center px-6">
        <svg className="w-12 h-12 mb-3 text-[var(--interactive)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        <p className="text-[var(--text-primary)] mb-2">This game opens better in a new tab</p>
        <p className="text-sm text-[var(--text-muted)] mb-4 max-w-sm">
          itch.io page URLs are not reliable iframe embeds unless they use the dedicated embed format.
        </p>
        <a
          href={game.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[var(--interactive)] text-[var(--text-on-accent)] rounded-lg hover:bg-[var(--interactive-hover)] transition-colors"
        >
          Open game
        </a>
      </div>
    );
  }

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-[var(--surface-deep)]'
    : 'h-full flex flex-col bg-[var(--surface-deep)]';

  return (
    <div className={containerClass}>
      {/* Controls */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-[var(--overlay-strong)]">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--interactive)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <span className="text-sm text-[var(--text-on-overlay)] opacity-80">
            {game.type === 'itch' ? 'itch.io' : 'Unity WebGL'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={game.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-[var(--glass-bg)] transition-colors text-[var(--text-on-overlay)] opacity-60 hover:opacity-100"
            aria-label="Open on itch.io"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-[var(--glass-bg)] transition-colors text-[var(--text-on-overlay)] opacity-60 hover:opacity-100"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Game iframe */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--overlay-strong)] z-10">
            <div className="w-8 h-8 border-2 border-[var(--interactive)] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-sm text-[var(--text-on-overlay)] opacity-60">Loading game...</span>
          </div>
        )}

        <iframe
          key={loadKey ?? 'game-viewer'}
          src={embedUrl}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock"
          allow="autoplay; fullscreen; gamepad"
          onLoad={() => setLoadedKey(loadKey)}
          title="Game"
        />
      </div>
    </div>
  );
}
