'use client';

import { cn } from '@/lib/utils';

/**
 * Loading spinner variants
 */
export type SpinnerVariant = 'default' | 'primary' | 'ai' | 'purple' | 'orange' | 'white';

/**
 * Loading spinner sizes
 */
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Color variant */
  variant?: SpinnerVariant;
  /** Optional loading message */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Center spinner in container */
  centered?: boolean;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-6 h-6 border',
  md: 'w-10 h-10 border-2',
  lg: 'w-12 h-12 border-2',
  xl: 'w-16 h-16 border-[3px]',
};

const variantClasses: Record<SpinnerVariant, { track: string; active: string }> = {
  default: {
    track: 'border-[var(--border)]',
    active: 'border-t-[var(--text-primary)]',
  },
  primary: {
    track: 'border-[var(--primary-muted)]',
    active: 'border-t-[var(--primary)]',
  },
  ai: {
    track: 'border-[var(--ai-muted)]',
    active: 'border-t-[var(--ai)]',
  },
  purple: {
    track: 'border-[var(--primary-muted)]',
    active: 'border-t-[var(--primary)]',
  },
  orange: {
    track: 'border-[var(--orange-muted)]',
    active: 'border-t-[var(--orange)]',
  },
  white: {
    track: 'border-[var(--glass-border)]',
    active: 'border-t-[var(--text-on-accent)]',
  },
};

/**
 * Reusable loading spinner component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingSpinner />
 *
 * // With message
 * <LoadingSpinner message="Loading content..." variant="primary" />
 *
 * // Centered in container
 * <LoadingSpinner centered size="lg" />
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  message,
  className,
  centered = false,
}: LoadingSpinnerProps) {
  const { track, active } = variantClasses[variant];

  const spinner = (
    <div
      className={cn(
        sizeClasses[size],
        track,
        active,
        'rounded-full animate-spin',
        className
      )}
      role="status"
      aria-label={message || 'Loading'}
    />
  );

  if (centered || message) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        {spinner}
        {message && (
          <span className="text-[var(--text-secondary)] text-sm">{message}</span>
        )}
      </div>
    );
  }

  return spinner;
}

/**
 * Full-page loading overlay
 */
export function LoadingOverlay({
  message = 'Loading...',
  variant = 'primary',
}: {
  message?: string;
  variant?: SpinnerVariant;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] backdrop-blur-sm">
      <LoadingSpinner size="xl" variant={variant} message={message} />
    </div>
  );
}

/**
 * Inline loading indicator for buttons, inputs, etc.
 */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="typing-dot w-2 h-2 bg-current rounded-full opacity-60" />
      <span className="typing-dot w-2 h-2 bg-current rounded-full opacity-60" />
      <span className="typing-dot w-2 h-2 bg-current rounded-full opacity-60" />
    </div>
  );
}

/**
 * Skeleton loading placeholder
 */
export function LoadingSkeleton({
  width,
  height,
  className,
  rounded = 'md',
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}) {
  const roundedClass = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--glass-bg)]',
        roundedClass,
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

export default LoadingSpinner;
