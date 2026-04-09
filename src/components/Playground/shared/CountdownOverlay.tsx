'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { springs } from '../design';

interface CountdownOverlayProps {
  isActive: boolean;
  onComplete: () => void;
  from?: number;
}

export function CountdownOverlay({
  isActive,
  onComplete,
  from = 3,
}: CountdownOverlayProps) {
  if (!isActive) return null;

  return <ActiveCountdownOverlay from={from} onComplete={onComplete} />;
}

interface ActiveCountdownOverlayProps {
  from: number;
  onComplete: () => void;
}

function ActiveCountdownOverlay({ from, onComplete }: ActiveCountdownOverlayProps) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  const progress = 1 - count / from;
  const circumference = 2 * Math.PI * 60; // radius 60

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--pg-bg-deep)]/90 backdrop-blur-xl"
    >
      {/* Background pulse */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-[var(--pg-accent-gold)]/5"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="relative">
        {/* Progress ring */}
        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 140 140">
          {/* Background ring */}
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
          />
          {/* Progress ring */}
          <motion.circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="var(--pg-accent-gold)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))',
            }}
          />
        </svg>

        {/* Number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={springs.bouncy}
                className="text-7xl font-bold text-[var(--pg-accent-gold)] font-mono"
                style={{
                  textShadow: '0 0 40px rgba(251, 191, 36, 0.5)',
                }}
              >
                {count}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Label */}
      <motion.span
        className="absolute bottom-1/3 text-[var(--pg-text-muted)] text-sm tracking-widest uppercase"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Get Ready
      </motion.span>
    </motion.div>
  );
}
