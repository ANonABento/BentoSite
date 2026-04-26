'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { RouteLoadingFallback } from '@/components/ui';

const SortingVisualizer = dynamic(
  () => import('@/components/Playground/SortingVisualizer').then((mod) => mod.SortingVisualizer),
  {
    ssr: false,
    loading: () => (
      <RouteLoadingFallback
        label="Loading Sorting Visualizer..."
        spinnerVariant="orange"
        className="bg-[var(--pg-bg-deep)]"
      />
    ),
  }
);

export default function SortingPage() {
  return (
    <ErrorBoundary title="Game Error" message="Sorting Visualizer failed to load. Please try again.">
      <SortingVisualizer />
    </ErrorBoundary>
  );
}
