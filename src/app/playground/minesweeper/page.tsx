'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/Dimension/ui/feedback/loading-spinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const Minesweeper = dynamic(
  () => import('@/components/Playground/Minesweeper').then((mod) => mod.Minesweeper),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[var(--pg-bg-deep)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
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
