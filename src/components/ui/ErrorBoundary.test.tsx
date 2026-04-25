import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  it('supports functional fallbacks that can retry', () => {
    let shouldThrow = true;

    function ProblemChild() {
      if (shouldThrow) {
        throw new Error('boom');
      }

      return <div>Recovered</div>;
    }

    render(
      <ErrorBoundary
        fallback={({ retry }) => (
          <button
            onClick={() => {
              shouldThrow = false;
              retry();
            }}
          >
            Retry
          </button>
        )}
      >
        <ProblemChild />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});
