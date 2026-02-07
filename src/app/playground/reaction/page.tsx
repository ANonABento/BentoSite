'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const ReactionGame = dynamic(
  () =>
    import('@/components/Playground/ReactionGame').then(
      (mod) => mod.ReactionGame
    ),
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

export default function ReactionPage() {
  return <ReactionGame />;
}
