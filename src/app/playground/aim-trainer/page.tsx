'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { RouteLoadingFallback } from '@/components/ui';

const AimTrainer = dynamic(
  () => import('@/components/Playground/AimTrainer').then((mod) => mod.AimTrainer),
  {
    ssr: false,
    loading: () => (
      <RouteLoadingFallback
        label="Loading Aim Trainer..."
        spinnerVariant="orange"
        className="bg-[var(--pg-bg-deep)]"
      />
    ),
  }
);

export default function AimTrainerPage() {
  return (
    <ErrorBoundary title="Game Error" message="Aim Trainer failed to load. Please try again.">
      <AimTrainer />
    </ErrorBoundary>
  );
}
