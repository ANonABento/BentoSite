import { useState, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';
import { LoadingOverlay, LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders a labeled spinner with the purple token variant', () => {
    render(<LoadingSpinner message="Loading content..." variant="purple" />);

    expect(screen.getByRole('status', { name: 'Loading content...' })).toHaveClass(
      'border-[var(--purple-muted)]'
    );
    expect(screen.getByText('Loading content...')).toBeInTheDocument();
  });

  it('renders the loading overlay with token-backed background styles', () => {
    render(<LoadingOverlay message="Please wait" />);

    expect(screen.getByText('Please wait')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Please wait' })).toHaveClass(
      'border-t-[var(--interactive)]'
    );
  });
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the default fallback when a child throws', () => {
    function Crash(): ReactElement {
      throw new Error('Boom');
    }

    render(
      <ErrorBoundary>
        <Crash />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('retries rendering after the fallback button is pressed', () => {
    function Crash(): ReactElement {
      throw new Error('Boom');
    }

    function RetryHarness() {
      const [shouldCrash, setShouldCrash] = useState(true);

      return (
        <ErrorBoundary onError={() => setShouldCrash(false)}>
          {shouldCrash ? <Crash /> : <div>Recovered</div>}
        </ErrorBoundary>
      );
    }

    render(<RetryHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});
