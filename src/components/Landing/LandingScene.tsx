'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';

const ThreeViewer = dynamic(() => import('@/components/Dimension/Dimension'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    </div>
  ),
});

interface LandingSceneProps {
  onEnter: () => void;
}

export default function LandingScene({ onEnter }: LandingSceneProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-[var(--background)] z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Full-screen 3D Viewer */}
      <div className="absolute inset-0">
        <ThreeViewer />
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 text-center px-4">
        {/* Name/Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-2xl">
            {PORTFOLIO_DATA.personal.name}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 drop-shadow-lg">
            {PORTFOLIO_DATA.personal.title}
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          onClick={onEnter}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5, type: 'spring' }}
          whileHover={{
            scale: 1.05,
            boxShadow: '0 0 40px rgba(167, 139, 250, 0.5)'
          }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 bg-violet-500/90 backdrop-blur-sm text-white rounded-2xl text-lg font-medium
            border border-violet-400/30 shadow-lg shadow-violet-500/30
            hover:bg-violet-400/90 transition-colors duration-300"
        >
          <span className="flex items-center gap-3">
            <span className="text-2xl">👋</span>
            Say Hi
          </span>
        </motion.button>

        {/* Hint text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 2 }}
          className="mt-8 text-sm text-gray-500"
        >
          Click to explore
        </motion.p>
      </div>
    </motion.div>
  );
}
