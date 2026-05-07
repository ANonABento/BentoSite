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
const BOOT_READOUTS = ['MEM OK', 'GPU CRT', 'LINK READY'];

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

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible ? (
        <motion.div
          className="fixed inset-0 z-[100] overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at center, #121119 0%, #08080c 62%, #030305 100%)',
          }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          onClick={isSkippable ? completeBoot : undefined}
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

          <div className="relative w-full h-full grid place-items-center p-3 sm:p-5 text-center z-[2]">
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
              className="crt-shell relative w-full max-w-[min(94vw,1440px)] h-[min(86vh,820px)] min-h-[560px] overflow-hidden rounded-[2.4rem] sm:rounded-[3.5rem] border border-white/10 transition-transform duration-75"
              style={{ transform: `translateX(${glitchOffset}px)` }}
            >
              <div className="crt-screen crt-effect relative h-full w-full overflow-hidden rounded-[2rem] sm:rounded-[3rem]">
                <div className="crt-content relative z-[3] flex h-full flex-col px-5 py-6 sm:px-10 sm:py-9">
                  <div className="flex items-start justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.28em] text-white/80 sm:text-xs">
                    <div className="text-left">
                      <div className="text-[var(--orange)]">ANonABento</div>
                      <div className="mt-2 text-white/40">v1.0.0</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">BOOT</div>
                      <div className="mt-2 text-[var(--purple)]">CRT MODE</div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col items-center justify-center gap-7 pb-4 pt-8">
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
                        <BentoIcon size={96} className="absolute inset-0 blur-md opacity-70 sm:hidden" />
                        <BentoIcon size={96} className="sm:hidden" />
                        <BentoIcon size={124} className="absolute inset-0 hidden blur-md opacity-70 sm:block" />
                        <BentoIcon size={124} className="hidden sm:block" />
                      </div>
                    </motion.div>

                    <motion.div
                      className="flex flex-col items-center gap-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (LOGO_FADE_DELAY + 200) / 1000, duration: 0.5 }}
                    >
                      <h1
                        className="crt-title font-mono text-6xl font-black leading-none tracking-normal sm:text-8xl md:text-9xl"
                        aria-label="bentOS"
                      >
                        <span className="text-white">bent</span>
                        <span className="text-white">OS</span>
                      </h1>
                      <p className="font-mono text-[11px] uppercase tracking-[0.42em] text-white/80 sm:text-sm md:text-base">
                        ANonABento&apos;s Portfolio Website
                      </p>
                    </motion.div>

                    <div className="flex w-full max-w-[620px] flex-col items-center gap-4 font-mono">
                      {isBarPhase ? (
                        <motion.div
                          className="w-full"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.26em] text-white/70 sm:text-xs">
                            <span>Loading Modules</span>
                            <span>{Math.round((filledSegments / SEGMENT_COUNT) * 100)}%</span>
                          </div>
                          <div className="border border-white/15 bg-white/[0.025] p-1 shadow-[inset_0_0_24px_rgba(0,0,0,0.65)]">
                            <div
                              className="grid gap-1"
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
                                        : 'rgba(255, 255, 255, 0.08)',
                                    boxShadow:
                                      index < filledSegments ? '0 0 12px rgba(224, 123, 60, 0.55)' : 'none',
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ) : null}

                      {phase === 'ready' ? (
                        <motion.div
                          className="w-full max-w-[430px] border border-white/15 bg-black/35 shadow-[inset_0_0_24px_rgba(0,0,0,0.72),0_0_28px_rgba(224,123,60,0.12)]"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.25, delay: 0.05 }}
                        >
                          <div className="px-4 py-3 sm:px-5">
                            <TerminalPrompt />
                          </div>
                        </motion.div>
                      ) : null}

                      <AnimatePresence>
                        {phase === 'loading' || phase === 'full' ? (
                          <motion.div
                            className="flex gap-4 text-[10px] uppercase tracking-[0.22em] text-white/45 sm:text-xs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {BOOT_READOUTS.map((readout) => (
                              <span key={readout}>{readout}</span>
                            ))}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex items-end justify-between font-mono text-[9px] uppercase tracking-[0.24em] text-white/35 sm:text-[10px]">
                    <span>SYS 05.07.26</span>
                    <span>PORTFOLIO INTERFACE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
