'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/Dimension/ui/feedback/loading-spinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const AimTrainer = dynamic(
  () => import('@/components/Playground/AimTrainer').then((mod) => mod.AimTrainer),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[var(--pg-bg-deep)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
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
