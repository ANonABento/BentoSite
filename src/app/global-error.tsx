'use client';

import { useEffect } from 'react';

/**
 * Last-resort recovery for a failure in the root layout itself.
 *
 * This replaces the root layout when it renders, which means none of the app's
 * CSS is loaded — no Tailwind, no theme tokens, no fonts. Everything here is
 * therefore self-contained inline styling, and it must render its own <html>
 * and <body>. Keep it boring: this is the page that has to work when the thing
 * that styles every other page is the thing that broke.
 */

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Root layout error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: '#0b0b0f',
          color: '#f4f4f5',
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '32rem' }}>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.75rem' }}>bentOS failed to start</h1>
          <p style={{ margin: '0 0 1.5rem', lineHeight: 1.6, color: '#a1a1aa' }}>
            Something went wrong before the page could load. Reloading usually
            clears it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              font: 'inherit',
              cursor: 'pointer',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              border: '1px solid #3f3f46',
              background: '#18181b',
              color: '#f4f4f5',
            }}
          >
            Reload
          </button>
          {error.digest && (
            <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#71717a' }}>
              ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
