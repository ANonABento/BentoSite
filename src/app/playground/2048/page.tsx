'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/Dimension/ui/feedback/loading-spinner';

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
  return <Game2048 />;
}
