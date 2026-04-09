'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/Dimension/ui/feedback/loading-spinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const Pacman = dynamic(
  () => import('@/components/Playground/Pacman').then((mod) => mod.Pacman),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[var(--pg-bg-deep)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    ),
  }
);

export default function PacmanPage() {
  return (
    <ErrorBoundary title="Game Error" message="Pac-Man failed to load. Please try again.">
      <Pacman />
    </ErrorBoundary>
  );
}
