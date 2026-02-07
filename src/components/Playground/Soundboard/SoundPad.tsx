'use client';

import { motion } from 'framer-motion';
import { SoundPad as SoundPadType } from './Soundboard.types';
import { PAD_SIZE, PAD_SIZE_MOBILE } from './Soundboard.config';

interface SoundPadProps {
  pad: SoundPadType;
  isActive: boolean;
  isMobile: boolean;
  onClick: () => void;
}

export function SoundPad({ pad, isActive, isMobile, onClick }: SoundPadProps) {
  const size = isMobile ? PAD_SIZE_MOBILE : PAD_SIZE;

  return (
    <motion.button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center rounded-xl font-medium select-none transition-colors overflow-hidden"
      style={{
        width: size,
        height: size,
        backgroundColor: isActive ? pad.color : `${pad.color}20`,
        border: `2px solid ${pad.color}40`,
      }}
      whileTap={{ scale: 0.95 }}
      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.15 }}
    >
      {/* Ripple effect when active */}
      {isActive && (
        <motion.div
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-xl"
          style={{ backgroundColor: pad.color }}
        />
      )}

      {/* Emoji */}
      <span className="text-2xl mb-1 relative z-10">{pad.emoji}</span>

      {/* Name */}
      <span
        className="text-xs relative z-10 transition-colors"
        style={{ color: isActive ? 'white' : pad.color }}
      >
        {pad.name}
      </span>

      {/* Key binding badge */}
      <span
        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded text-[10px] font-mono uppercase transition-colors"
        style={{
          backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : `${pad.color}30`,
          color: isActive ? 'white' : pad.color,
        }}
      >
        {pad.keyBinding}
      </span>
    </motion.button>
  );
}
