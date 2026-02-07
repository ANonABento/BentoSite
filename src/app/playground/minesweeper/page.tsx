'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/Dimension/ui/feedback/loading-spinner';

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
  return <Minesweeper />;
}
