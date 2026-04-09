'use client';

import { Component, ReactNode } from 'react';
import { WarningIcon } from './Icons';

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback UI to display on error */
  fallback?: ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Custom title for default fallback */
  title?: string;
  /** Custom message for default fallback */
  message?: string;
  /** Custom retry button text */
  retryText?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component for graceful error handling
 * Catches JavaScript errors in child component tree and displays fallback UI
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<CustomError />}>
 *   <ComponentThatMayFail />
 * </ErrorBoundary>
 *
 * // Or with default fallback
 * <ErrorBoundary title="Viewer Error" message="Failed to load 3D model">
 *   <ThreeJSComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Return custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      const {
        title = 'Something went wrong',
        message = 'This component failed to load.',
        retryText = 'Try again',
      } = this.props;

      return (
        <div className="w-full h-full flex items-center justify-center glass backdrop-blur-sm rounded-2xl">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 text-[var(--status-error)]">
              <WarningIcon size={64} />
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              {title}
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              {message}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-xs text-[color:var(--status-error)] opacity-80 mb-4 max-w-md mx-auto overflow-auto">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-[var(--interactive)] hover:bg-[var(--interactive-hover)] active:bg-[var(--interactive-active)] text-[var(--text-on-accent)] rounded-lg text-sm transition-colors"
            >
              {retryText}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Inline error display for smaller error states
 * Used within forms, cards, etc.
 */
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-[var(--status-error)] text-sm p-2 rounded bg-[var(--status-error-muted)]">
      <WarningIcon size={16} />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs underline hover:opacity-80 transition-opacity"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorBoundary;
