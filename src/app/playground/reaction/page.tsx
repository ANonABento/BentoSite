'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { RouteLoadingFallback } from '@/components/ui';

const ReactionGame = dynamic(
  () =>
    import('@/components/Playground/ReactionGame').then(
      (mod) => mod.ReactionGame
    ),
  {
    ssr: false,
    loading: () => (
      <RouteLoadingFallback
        label="Loading Reaction..."
        spinnerVariant="orange"
        className="bg-[var(--background)]"
      />
    ),
  }
);

export default function ReactionPage() {
  return (
    <ErrorBoundary title="Game Error" message="Reaction Game failed to load. Please try again.">
      <ReactionGame />
    </ErrorBoundary>
  );
}
