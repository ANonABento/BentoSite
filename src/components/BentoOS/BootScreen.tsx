'use client';

import { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BentoIcon } from './BentoIcon';
import { TerminalPrompt } from './TerminalPrompt';
import { useBootSequence } from './useBootSequence';

interface BootScreenProps {
  onExiting: () => void;
  onComplete: () => void;
}

const LOGO_FADE_DELAY = 300;
const SEGMENT_COUNT = 16;
const PROGRESS_BAR_CELLS = 20;
const PROGRESS_FILLED_CHAR = '█';
const PROGRESS_EMPTY_CHAR = '░';

function buildProgressBar(progress: number): string {
  const clamped = Math.max(0, Math.min(1, progress));
  const filled = Math.round(clamped * PROGRESS_BAR_CELLS);
  return (
    PROGRESS_FILLED_CHAR.repeat(filled) +
    PROGRESS_EMPTY_CHAR.repeat(PROGRESS_BAR_CELLS - filled)
  );
}

export function BootScreen({ onExiting, onComplete }: BootScreenProps) {
  const {
    autoAdvanceProgress,
    completeBoot,
    filledSegments,
    glitchOffset,
    isBarPhase,
    isSkippable,
    isVisible,
    phase,
    showFlash,
  } = useBootSequence({ onExiting });

  const handleSkippablePointerDown = useCallback(() => {
    if (isSkippable) {
      completeBoot();
    }
  }, [completeBoot, isSkippable]);

  const handleSkippableTouchStart = useCallback(() => {
    if (isSkippable) {
      completeBoot();
    }
  }, [completeBoot, isSkippable]);

  const handleContinueClick = useCallback(() => {
    completeBoot();
  }, [completeBoot]);

  const progressBarText = buildProgressBar(autoAdvanceProgress);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible ? (
        <motion.div
          className="fixed inset-0 z-[100]"
          style={{
            background:
              'radial-gradient(ellipse at center, #0f0f14 0%, #08080c 70%, #050508 100%)',
          }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          onClick={isSkippable ? completeBoot : undefined}
          onPointerDown={handleSkippablePointerDown}
          onTouchStart={handleSkippableTouchStart}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1]" aria-hidden="true">
            <filter id="boot-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#boot-noise)" opacity="0.03" />
          </svg>

          <div
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(224, 123, 60, 0.025) 0%, rgba(224, 123, 60, 0.01) 40%, rgba(224, 123, 60, 0) 100%)',
            }}
          />

          <div className="relative w-full h-full grid place-items-center p-6 text-center crt-effect z-[2]">
            <AnimatePresence>
              {showFlash ? (
                <motion.div
                  className="absolute inset-0 z-10 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.08 }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        phase === 'done'
                          ? 'rgba(224, 123, 60, 0.08)'
                          : 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, rgba(224, 123, 60, 0.1) 60%, transparent 100%)',
                    }}
                  />
                  {phase !== 'done' ? (
                    <div
                      className="absolute inset-x-0 h-[2px] animate-crt-scanline"
                      style={{
                        background: 'rgba(255, 255, 255, 0.25)',
                        boxShadow: '0 0 8px rgba(255, 255, 255, 0.15)',
                      }}
                    />
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div
              className="crt-content flex flex-col items-center gap-8 max-w-[90vw] transition-transform duration-75"
              style={{ transform: `translateX(${glitchOffset}px)` }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: LOGO_FADE_DELAY / 1000,
                  duration: 0.6,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <div className="relative inline-block">
                  <BentoIcon size={64} className="absolute inset-0 blur-sm opacity-70" />
                  <BentoIcon size={64} />
                </div>
              </motion.div>

              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (LOGO_FADE_DELAY + 200) / 1000, duration: 0.5 }}
              >
                <span className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                  ANonABento
                </span>
                <h1 className="text-5xl md:text-6xl font-bold font-mono tracking-tight">
                  <span
                    className="text-[var(--orange)]"
                    style={{
                      textShadow:
                        '0 0 12px rgba(224, 123, 60, 0.8), 0 0 24px rgba(224, 123, 60, 0.3)',
                    }}
                  >
                    bent
                  </span>
                  <span
                    className="text-[var(--primary)]"
                    style={{
                      textShadow:
                        '0 0 12px rgba(224, 123, 60, 0.8), 0 0 24px rgba(224, 123, 60, 0.3)',
                    }}
                  >
                    OS
                  </span>
                </h1>
              </motion.div>

              <div className="flex flex-col items-center gap-3 min-h-[60px]">
                {isBarPhase ? (
                  <motion.div
                    className="rounded-lg border border-white/10 overflow-hidden"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex gap-[2px] p-[3px]">
                      {Array.from({ length: SEGMENT_COUNT }).map((_, index) => (
                        <div
                          key={index}
                          className="w-2 h-3 rounded-sm transition-all duration-200"
                          style={{
                            background:
                              index < filledSegments
                                ? 'var(--orange)'
                                : 'rgba(255, 255, 255, 0.06)',
                            boxShadow:
                              index < filledSegments ? '0 0 8px var(--orange-muted)' : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : null}

                {phase === 'ready' ? (
                  <motion.div
                    className="flex flex-col items-center gap-3 rounded-lg border border-white/10 overflow-hidden"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                  >
                    <div className="px-4 pt-3">
                      <TerminalPrompt />
                    </div>
                    <div
                      aria-hidden="true"
                      className="px-4 font-mono text-[10px] tracking-[0.2em] text-[var(--text-muted)] whitespace-pre"
                    >
                      [{progressBarText}]
                    </div>
                    <button
                      type="button"
                      onClick={handleContinueClick}
                      aria-label="Continue to dashboard"
                      className="mb-3 mt-1 px-3 py-1 font-mono text-xs tracking-wider text-[var(--orange)] border border-[var(--orange)]/40 rounded-sm hover:bg-[var(--orange)]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)]/60 transition-colors"
                    >
                      &gt; continue _
                    </button>
                  </motion.div>
                ) : null}

                <AnimatePresence>
                  {phase === 'loading' || phase === 'full' ? (
                    <motion.span
                      className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      v1.0
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
