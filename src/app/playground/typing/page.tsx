'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TypingGame = dynamic(
  () =>
    import('@/components/Playground/TypingGame').then((mod) => mod.TypingGame),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[var(--text-secondary)]"
        >
          Loading...
        </motion.div>
      </div>
    ),
  }
);

export default function TypingPage() {
  return (
    <ErrorBoundary title="Game Error" message="Typing Game failed to load. Please try again.">
      <TypingGame />
    </ErrorBoundary>
  );
}
