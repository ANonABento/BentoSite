'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner, SpinnerSize, SpinnerVariant } from './LoadingSpinner';

interface LazyPanelFallbackProps {
  icon?: ReactNode;
  label: string;
  detail?: string;
  spinnerSize?: SpinnerSize;
  spinnerVariant?: SpinnerVariant;
  className?: string;
}

export function LazyPanelFallback({
  icon,
  label,
  detail,
  spinnerSize = 'md',
  spinnerVariant = 'purple',
  className,
}: LazyPanelFallbackProps) {
  return (
    <div
      className={cn(
        'w-full h-full flex items-center justify-center p-6',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        {icon}
        <LoadingSpinner size={spinnerSize} variant={spinnerVariant} />
        <span className="text-[var(--text-secondary)] text-sm font-medium">{label}</span>
        {detail ? (
          <span className="text-[var(--text-muted)] text-xs max-w-xs">{detail}</span>
        ) : null}
      </div>
    </div>
  );
}
