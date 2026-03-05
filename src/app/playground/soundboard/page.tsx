'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/Dimension/ui/feedback/loading-spinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const Soundboard = dynamic(
  () => import('@/components/Playground/Soundboard').then((mod) => mod.Soundboard),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[var(--pg-bg-deep)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
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
