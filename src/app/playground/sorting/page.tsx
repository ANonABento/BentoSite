'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/Dimension/ui/feedback/loading-spinner';

const SortingVisualizer = dynamic(
  () => import('@/components/Playground/SortingVisualizer').then((mod) => mod.SortingVisualizer),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[var(--pg-bg-deep)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    ),
  }
);

export default function SortingPage() {
  return <SortingVisualizer />;
}
