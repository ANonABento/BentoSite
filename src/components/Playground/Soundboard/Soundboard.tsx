'use client';

import { motion } from 'framer-motion';
import { Volume2, Music } from 'lucide-react';
import { GameLayout } from '../shared';
import { useSoundboard } from './Soundboard.hooks';
import { SoundPad } from './SoundPad';
import { SoundCategory } from './Soundboard.types';
import { GRID_COLS, PAD_SIZE, PAD_SIZE_MOBILE, PAD_GAP, CATEGORY_COLORS } from './Soundboard.config';
import { useIsMobile } from '../Playground.hooks';
import { springs } from '../design';

const CATEGORIES: { id: SoundCategory | 'all'; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'drums', name: 'Drums' },
  { id: 'effects', name: 'Effects' },
  { id: 'memes', name: 'Memes' },
];

export function Soundboard() {
  const isMobile = useIsMobile();

  const {
    pads,
    activePads,
    volume,
    selectedCategory,
    setVolume,
    setSelectedCategory,
    playPad,
    initAudioContext,
  } = useSoundboard();

  // Initialize audio on first click
  const handlePadClick = (padId: string) => {
    initAudioContext();
    playPad(padId);
  };

  const padSize = isMobile ? PAD_SIZE_MOBILE : PAD_SIZE;
  const gridWidth = GRID_COLS * padSize + (GRID_COLS - 1) * PAD_GAP;

  return (
    <GameLayout
      title="Soundboard"
      subtitle="Click or use keyboard"
      headerRight={
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[var(--pg-text-muted)]" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="pg-range w-20"
            aria-label="Soundboard volume"
          />
        </div>
      }
    >
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
          className="text-center mb-8"
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--pg-accent-primary)]/10 text-[var(--pg-accent-primary)] mb-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={springs.bouncy}
          >
            <Music className="w-8 h-8" />
          </motion.div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--pg-text-primary)] mb-2">
            Soundboard
          </h2>
          <p className="text-sm text-[var(--pg-text-secondary)]">
            Press keys or tap pads to play sounds
          </p>
        </motion.div>

        {/* Category filter */}
        <div className="flex gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              aria-label={`Show ${cat.name.toLowerCase()} sound pads`}
              aria-pressed={selectedCategory === cat.id}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${selectedCategory === cat.id
                  ? 'bg-[var(--pg-accent-primary)] text-black'
                  : 'bg-[var(--pg-bg-elevated)] text-[var(--pg-text-secondary)] hover:bg-[var(--pg-bg-hover)]'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {cat.id !== 'all' && (
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: CATEGORY_COLORS[cat.id as SoundCategory] }}
                />
              )}
              {cat.name}
            </motion.button>
          ))}
        </div>

        {/* Pad grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pg-surface-frame grid gap-3 rounded-2xl p-4"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, ${padSize}px)`,
            maxWidth: gridWidth + 32,
          }}
        >
          {pads.map((pad, index) => (
            <motion.div
              key={pad.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
            >
              <SoundPad
                pad={pad}
                isActive={activePads.has(pad.id)}
                isMobile={isMobile}
                onClick={() => handlePadClick(pad.id)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Keyboard hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-[var(--pg-text-muted)]">
            Keyboard: 1-4, Q-R, A-F, Z-V
          </p>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center max-w-sm"
        >
          <p className="text-xs text-[var(--pg-text-muted)] leading-relaxed">
            This soundboard uses synthesized sounds. For real audio samples, you can upload your own sounds.
          </p>
        </motion.div>
      </div>
    </GameLayout>
  );
}
