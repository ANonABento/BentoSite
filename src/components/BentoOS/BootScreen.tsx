'use client';

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

function getBootStatus(phase: string) {
  if (phase === 'ready') {
    return {
      mode: 'interactive',
      footer: 'INTERFACE READY',
      progressLabel: 'INTERFACE READY',
      progressValue: 'OK',
    };
  }

  if (phase === 'full') {
    return {
      mode: 'interactive',
      footer: 'INTERFACE READY',
      progressLabel: 'LOADING INTERFACE',
      progressValue: '100%',
    };
  }

  return {
    mode: 'loading',
    footer: 'LOCAL SESSION',
    progressLabel: 'LOADING INTERFACE',
    progressValue: null,
  };
}

export function BootScreen({ onExiting, onComplete }: BootScreenProps) {
  const {
    completeBoot,
    filledSegments,
    glitchOffset,
    isBarPhase,
    isSkippable,
    isVisible,
    phase,
    showFlash,
  } = useBootSequence({ onExiting });
  const bootStatus = getBootStatus(phase);
  const progressPercent = Math.round((filledSegments / SEGMENT_COUNT) * 100);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible ? (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden bg-black"
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          onClick={isSkippable ? completeBoot : undefined}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1]" aria-hidden="true">
            <filter id="boot-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#boot-noise)" opacity="0.04" />
          </svg>

          <AnimatePresence>
            {showFlash ? (
              <motion.div
                className="absolute inset-0 z-[20] pointer-events-none"
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
            className="crt-shell boot-shell relative w-full h-full overflow-hidden transition-transform duration-75"
            style={{ transform: `translateX(${glitchOffset}px)` }}
          >
            <div className="boot-screen-surface crt-effect relative h-full w-full overflow-hidden">
              <div className="boot-dots pointer-events-none absolute inset-0 z-[4]" aria-hidden="true" />
              <div className="boot-glass pointer-events-none absolute inset-0 z-[5]" aria-hidden="true" />

              <div className="crt-content relative z-[3] flex h-full flex-col px-7 py-8 sm:px-16 sm:py-14 md:px-24 md:py-20">
                <div className="boot-corner flex items-start justify-between gap-4 leading-tight">
                  <div className="text-left">
                    <div className="text-white/85">ANonABento</div>
                    <div className="mt-1 text-white/45">v1.0.0</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white">BOOT</div>
                    <div className="mt-1 text-[var(--purple)]">CRT MODE</div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center gap-12 pb-2 pt-4">
                  <motion.div
                    className="flex flex-col items-center gap-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (LOGO_FADE_DELAY + 200) / 1000, duration: 0.5 }}
                  >
                    <div className="boot-title-row inline-flex items-start justify-center">
                      <h1
                        className="boot-title boot-title-text relative inline-flex items-baseline"
                        aria-label="bentOS"
                      >
                        <span>bent</span>
                        <span>OS</span>
                      </h1>
                      <motion.div
                        className="boot-title-logo hidden sm:block"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: LOGO_FADE_DELAY / 1000,
                          duration: 0.6,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        <div className="boot-logo-mark relative w-full h-full">
                          <BentoIcon size={120} className="w-full h-full" />
                        </div>
                      </motion.div>
                    </div>
                    <p className="font-crt uppercase text-white/70 whitespace-nowrap text-[0.7rem] tracking-[0.34em] sm:text-sm sm:tracking-[0.52em] md:text-base">
                      ANonABento Portfolio Website
                    </p>
                  </motion.div>

                  <div className="relative flex w-full max-w-[640px] flex-col items-center gap-5 min-h-[120px] sm:min-h-[136px]">
                    <AnimatePresence mode="wait">
                      {isBarPhase ? (
                        <motion.div
                          key="bar"
                          className="w-full font-crt"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, filter: 'blur(2px)' }}
                          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        >
                          <div className="mb-4 uppercase text-[0.72rem] tracking-[0.24em] text-white/80 sm:text-sm sm:tracking-[0.32em]">
                            <span>{bootStatus.progressLabel}</span>
                          </div>
                          <div className="flex items-center gap-5">
                            <div className="flex-1 border border-white/12 bg-white/[0.02] p-1 shadow-[inset_0_0_24px_rgba(0,0,0,0.7)]">
                              <div
                                className="grid gap-[3px]"
                                style={{ gridTemplateColumns: `repeat(${SEGMENT_COUNT}, minmax(0, 1fr))` }}
                              >
                                {Array.from({ length: SEGMENT_COUNT }).map((_, index) => (
                                  <div
                                    key={index}
                                    className="h-4 transition-all duration-200 sm:h-5"
                                    style={{
                                      background:
                                        index < filledSegments
                                          ? 'var(--orange)'
                                          : 'rgba(255, 255, 255, 0.06)',
                                      boxShadow:
                                        index < filledSegments ? '0 0 12px rgba(224, 123, 60, 0.45)' : 'none',
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="min-w-[4ch] text-right uppercase text-base tracking-[0.08em] text-white/85 sm:text-xl">
                              {bootStatus.progressValue ?? `${progressPercent}%`}
                            </span>
                          </div>
                        </motion.div>
                      ) : phase === 'ready' ? (
                        <motion.div
                          key="prompt"
                          className="boot-prompt-card flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5"
                          initial={{ opacity: 0, scale: 0.94, filter: 'blur(3px)' }}
                          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
                        >
                          <TerminalPrompt />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="boot-corner flex items-end justify-between text-white/45">
                  <span>SYS 05.07.26</span>
                  <span>{bootStatus.footer}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
