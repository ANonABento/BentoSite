'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TransparentHeader } from './header';
import { BentoGrid } from './grid';
import { VoidBackground } from './background';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

export function BentoHub() {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-[var(--pg-bg-deep)] relative overflow-hidden">
      {/* 3D Particle Background */}
      <VoidBackground />

      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none mix-blend-overlay z-[1]" />

      {/* Transparent Header */}
      <TransparentHeader />

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Physics Bento Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <BentoGrid isMobile={isMobile} />
          </motion.div>

          {/* Footer hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16"
          >
            <p className="text-[var(--pg-text-muted)] text-sm flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Your high scores are saved locally
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
