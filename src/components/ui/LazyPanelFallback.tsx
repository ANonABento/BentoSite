'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner, type SpinnerSize, type SpinnerVariant } from './LoadingSpinner';

interface LazyPanelFallbackProps {
  label: string;
  icon?: ReactNode;
  spinnerSize?: SpinnerSize;
  spinnerVariant?: SpinnerVariant;
  className?: string;
}

export function LazyPanelFallback({
  label,
  icon,
  spinnerSize = 'md',
  spinnerVariant = 'purple',
  className,
}: LazyPanelFallbackProps) {
  return (
    <div
      className={cn(
        'flex min-h-[240px] w-full flex-col items-center justify-center gap-4 p-6 text-center',
        className
      )}
      role="status"
      aria-label={label}
    >
      {icon ? (
        <div className="text-[var(--purple)]" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <LoadingSpinner size={spinnerSize} variant={spinnerVariant} />
      <p className="font-mono text-sm text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
