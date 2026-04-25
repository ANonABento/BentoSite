'use client';

interface ScrollableErrorFallbackProps {
  onRetry: () => void;
}

export function ScrollableErrorFallback({ onRetry }: ScrollableErrorFallbackProps) {
  return (
    <div className="w-full h-full flex items-center justify-center glass backdrop-blur-sm rounded-2xl">
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 text-[var(--status-error)]">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          Something went wrong
        </h3>
        <p className="text-[var(--text-secondary)] text-sm mb-4">
          This component failed to load.
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[var(--interactive)] hover:bg-[var(--interactive-hover)] active:bg-[var(--interactive-active)] text-[var(--text-on-accent)] rounded-lg text-sm transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
