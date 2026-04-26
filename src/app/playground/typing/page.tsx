'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { RouteLoadingFallback } from '@/components/ui';

const TypingGame = dynamic(
  () =>
    import('@/components/Playground/TypingGame').then((mod) => mod.TypingGame),
  {
    ssr: false,
    loading: () => (
      <RouteLoadingFallback
        label="Loading Typing..."
        spinnerVariant="orange"
        className="bg-[var(--background)]"
      />
    ),
  }
);

export default function TypingPage() {
  return (
    <ErrorBoundary title="Game Error" message="Typing Game failed to load. Please try again.">
      <TypingGame />
    </ErrorBoundary>
  );
}
