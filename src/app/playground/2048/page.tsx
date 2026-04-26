'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { RouteLoadingFallback } from '@/components/ui';

const Game2048 = dynamic(
  () => import('@/components/Playground/Game2048').then((mod) => mod.Game2048),
  {
    ssr: false,
    loading: () => (
      <RouteLoadingFallback
        label="Loading 2048..."
        spinnerVariant="orange"
        className="bg-[var(--pg-bg-deep)]"
      />
    ),
  }
);

export default function Game2048Page() {
  return (
    <ErrorBoundary title="Game Error" message="2048 failed to load. Please try again.">
      <Game2048 />
    </ErrorBoundary>
  );
}
