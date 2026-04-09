'use client';

import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Music, Drum, ArrowLeft, Piano } from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const RhythmGame = dynamic(
  () =>
    import('@/components/Playground/RhythmGame').then((mod) => mod.RhythmGame),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
);

const TaikoGame = dynamic(
  () =>
    import('@/components/Playground/RhythmGame/modes').then((mod) => mod.TaikoGame),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
);

const ManiaGame = dynamic(
  () =>
    import('@/components/Playground/RhythmGame/modes').then((mod) => mod.ManiaGame),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
);

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[var(--pg-bg-deep)] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[var(--pg-text-secondary)]"
      >
        Loading...
      </motion.div>
    </div>
  );
}

type RhythmMode = 'select' | 'osu' | 'taiko' | 'mania';

const modes = [
  {
    id: 'osu' as const,
    name: 'osu! Style',
    description: 'Click circles in time with the music',
    icon: Music,
    color: 'var(--pg-accent-gold)',
    available: true,
  },
  {
    id: 'taiko' as const,
    name: 'Taiko',
    description: 'Drum game - hit the notes with D/F and J/K',
    icon: Drum,
    color: '#ee5533',
    available: true,
  },
  {
    id: 'mania' as const,
    name: 'Mania',
    description: 'Falling notes - 4K/6K/7K keyboard',
    icon: Piano,
    color: 'var(--purple)',
    available: true,
  },
];

export default function RhythmPage() {
  const [mode, setMode] = useState<RhythmMode>('select');

  const handleBack = () => setMode('select');

  return (
    <AnimatePresence mode="wait">
      {mode === 'select' && (
        <motion.div
          key="select"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-[var(--pg-bg-deep)] flex flex-col"
        >
          {/* Header */}
          <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--pg-bg-surface)]/80 border-b border-white/[0.06]">
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center">
              <Link
                href="/playground"
                className="flex items-center gap-2 text-[var(--pg-text-muted)] hover:text-[var(--pg-text-primary)] transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Playground</span>
              </Link>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="text-center w-full max-w-lg"
            >
              {/* Icon */}
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--pg-accent-gold)]/10 text-[var(--pg-accent-gold)] mb-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Music className="w-10 h-10" />
              </motion.div>

              <h1 className="text-4xl sm:text-5xl font-bold text-[var(--pg-text-primary)] mb-4 tracking-tight">
                Rhythm Games
              </h1>

              <p className="text-[var(--pg-text-secondary)] mb-10 text-lg">
                Choose your game mode
              </p>

              {/* Mode selection */}
              <div className="space-y-4">
                {modes.map((m, index) => (
                  <motion.button
                    key={m.id}
                    onClick={() => m.available && setMode(m.id)}
                    disabled={!m.available}
                    className={`
                      w-full p-5 rounded-xl text-left transition-all duration-200 border
                      ${m.available
                        ? 'bg-[var(--pg-bg-elevated)] hover:bg-[var(--pg-bg-hover)] border-white/[0.06] cursor-pointer'
                        : 'bg-[var(--pg-bg-surface)] border-white/[0.03] cursor-not-allowed opacity-50'
                      }
                    `}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={m.available ? { scale: 1.02, x: 5 } : {}}
                    whileTap={m.available ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${m.color}20`, color: m.color }}
                      >
                        <m.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--pg-text-primary)]">
                            {m.name}
                          </span>
                          {!m.available && (
                            <span className="px-2 py-0.5 rounded text-xs bg-white/5 text-[var(--pg-text-muted)]">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--pg-text-muted)] mt-0.5">
                          {m.description}
                        </p>
                      </div>
                      {m.available && (
                        <ArrowLeft className="w-5 h-5 text-[var(--pg-text-muted)] rotate-180" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </main>
        </motion.div>
      )}

      {mode === 'osu' && (
        <motion.div
          key="osu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ErrorBoundary title="Game Error" message="osu! Style game failed to load. Please try again.">
            <RhythmGame />
          </ErrorBoundary>
        </motion.div>
      )}

      {mode === 'taiko' && (
        <motion.div
          key="taiko"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ErrorBoundary title="Game Error" message="Taiko game failed to load. Please try again.">
            <TaikoGame onBack={handleBack} />
          </ErrorBoundary>
        </motion.div>
      )}

      {mode === 'mania' && (
        <motion.div
          key="mania"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ErrorBoundary title="Game Error" message="Mania game failed to load. Please try again.">
            <ManiaGame onBack={handleBack} />
          </ErrorBoundary>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
