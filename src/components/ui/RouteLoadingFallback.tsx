'use client';

import { BentoIcon } from '@/components/BentoOS/BentoIcon';
import { cn } from '@/lib/utils';
import { LazyPanelFallback } from './LazyPanelFallback';
import type { SpinnerVariant } from './LoadingSpinner';

interface RouteLoadingFallbackProps {
  label: string;
  spinnerVariant?: SpinnerVariant;
  className?: string;
  showIcon?: boolean;
}

export function RouteLoadingFallback({
  label,
  spinnerVariant = 'purple',
  className,
  showIcon = false,
}: RouteLoadingFallbackProps) {
  return (
    <main className={cn('min-h-screen bg-atmosphere', className)}>
      <LazyPanelFallback
        icon={showIcon ? <BentoIcon size={32} className="animate-pulse" /> : undefined}
        label={label}
        spinnerSize="sm"
        spinnerVariant={spinnerVariant}
      />
    </main>
  );
}
