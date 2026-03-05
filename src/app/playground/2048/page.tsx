'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/Dimension/ui/feedback/loading-spinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const Game2048 = dynamic(
  () => import('@/components/Playground/Game2048').then((mod) => mod.Game2048),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[var(--pg-bg-deep)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
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
