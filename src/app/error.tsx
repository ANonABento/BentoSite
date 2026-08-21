'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Route-segment error recovery.
 *
 * The panel-level `ErrorBoundary` covers the dashboard panels and the
 * playground games, and `SceneErrorBoundary` covers the 3D scene — but
 * `/projects`, `/photography`, and `/playground` run Matter.js and a WebGL
 * canvas with no boundary of their own. Without this file a throw in any of
 * them replaces the whole page with Next's bare "Application error" text on a
 * white background, with no way back into the site.
 *
 * App Router applies this to every segment that does not define its own, so
 * one file covers all of them.
 */

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    // Production strips the message from the props, so the console is the only
    // place the real cause survives.
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--background)] bg-grid flex items-center justify-center p-4">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary-muted)] opacity-50 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--primary-muted)] opacity-50 rounded-full blur-[100px]" />
      </div>

      <div className="relative glass rounded-2xl p-8 md:p-12 max-w-lg w-full text-center glow-subtle">
        <h1 className="text-6xl md:text-7xl font-bold text-gradient mb-4">oops</h1>

        <h2 className="text-xl md:text-2xl font-semibold text-[var(--text-primary)] mb-2">
          Something broke on this page
        </h2>
        <p className="text-[var(--text-secondary)] mb-8">
          Not your fault. Try again — and if it keeps happening, the rest of the
          site still works.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium
              text-[var(--text-on-accent)] hover:shadow-[0_0_20px_var(--primary-muted)] hover:scale-105
              transition-all duration-300"
            style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-active))' }}
          >
            Try again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium
              border border-[var(--border)] text-[var(--text-primary)]
              hover:border-[var(--primary)] transition-all duration-300"
          >
            Back to home
          </Link>
        </div>

        {/* The digest is the only handle on a production stack trace, so show
            it rather than making Kevin correlate by timestamp. */}
        {error.digest && (
          <p className="mt-8 font-mono text-xs text-[var(--text-muted)]">
            ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
