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

      {/* Subtle noise overlay via CSS gradient (no external image needed) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay z-[1]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")' }} />

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
