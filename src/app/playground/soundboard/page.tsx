'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/Dimension/ui/feedback/loading-spinner';

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
  return <Soundboard />;
}
