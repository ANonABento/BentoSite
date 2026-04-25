'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { RouteLoadingFallback } from '@/components/ui';

const Pacman = dynamic(
  () => import('@/components/Playground/Pacman').then((mod) => mod.Pacman),
  {
    ssr: false,
    loading: () => (
      <RouteLoadingFallback
        label="Loading Pac-Man..."
        spinnerVariant="orange"
        className="bg-[var(--pg-bg-deep)]"
      />
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
