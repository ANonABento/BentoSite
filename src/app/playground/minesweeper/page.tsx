'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { RouteLoadingFallback } from '@/components/ui';

const Minesweeper = dynamic(
  () => import('@/components/Playground/Minesweeper').then((mod) => mod.Minesweeper),
  {
    ssr: false,
    loading: () => (
      <RouteLoadingFallback
        label="Loading Minesweeper..."
        spinnerVariant="orange"
        className="bg-[var(--pg-bg-deep)]"
      />
    ),
  }
);

export default function MinesweeperPage() {
  return (
    <ErrorBoundary title="Game Error" message="Minesweeper failed to load. Please try again.">
      <Minesweeper />
    </ErrorBoundary>
  );
}
