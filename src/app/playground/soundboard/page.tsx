'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { RouteLoadingFallback } from '@/components/ui';

const Soundboard = dynamic(
  () => import('@/components/Playground/Soundboard').then((mod) => mod.Soundboard),
  {
    ssr: false,
    loading: () => (
      <RouteLoadingFallback
        label="Loading Soundboard..."
        spinnerVariant="orange"
        className="bg-[var(--pg-bg-deep)]"
      />
    ),
  }
);

export default function SoundboardPage() {
  return (
    <ErrorBoundary title="Game Error" message="Soundboard failed to load. Please try again.">
      <Soundboard />
    </ErrorBoundary>
  );
}
