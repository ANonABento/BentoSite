'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BentoIcon } from './BentoIcon';
import { TerminalPrompt } from './TerminalPrompt';
import { Typewriter } from './Typewriter';
import { useBootSequence } from './useBootSequence';

interface BootScreenProps {
  onExiting: () => void;
  onComplete: () => void;
}

const SEGMENT_COUNT = 13;

function TypedText({
  text,
  className,
  startDelay,
  speed,
}: {
  text: string;
  className?: string;
  startDelay?: number;
  speed?: number;
}) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <Typewriter text={text} startDelay={startDelay} speed={speed} />
    </span>
  );
}

function getBootStatus(phase: string) {
  if (phase === 'ready') {
    return {
      mode: 'interactive',
      progressLabel: 'INTERFACE READY',
      progressValue: 'OK',
    };
  }

  if (phase === 'full') {
    return {
      mode: 'interactive',
      progressLabel: 'LOADING SYSTEM MODULES',
      progressValue: '100%',
    };
  }

  return {
    mode: 'loading',
    progressLabel: 'LOADING SYSTEM MODULES',
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
          exit={{ opacity: 0, scale: 0.96 }}
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

              {/*
                CRT power-on sequence — fires once on mount.
                Two black shutter bars retract from top/bottom revealing the
                screen, while a bright scan line briefly lights at the slit.
                Cubic-bezier matches the rest of the boot animations so the
                vocabulary stays consistent.
              */}
              <motion.div
                className="absolute inset-x-0 top-0 bg-black pointer-events-none z-[10]"
                initial={{ height: '49.8%' }}
                animate={{ height: '0%' }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
                aria-hidden="true"
              />
              <motion.div
                className="absolute inset-x-0 bottom-0 bg-black pointer-events-none z-[10]"
                initial={{ height: '49.8%' }}
                animate={{ height: '0%' }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
                aria-hidden="true"
              />
              {/* Power-on flash — simple horizontal + vertical white lines
                  that briefly light up at the slit as the shutters retract. */}
              <motion.div
                className="absolute left-0 right-0 top-1/2 -translate-y-1/2 bg-white pointer-events-none z-[11]"
                style={{ height: 2, boxShadow: '0 0 10px 2px rgba(255, 255, 255, 0.65)' }}
                initial={{ opacity: 0.95, scaleX: 0.4 }}
                animate={{ opacity: 0, scaleX: 1 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                aria-hidden="true"
              />
              <motion.div
                className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 bg-white pointer-events-none z-[11]"
                style={{ width: 2, boxShadow: '0 0 10px 2px rgba(255, 255, 255, 0.55)' }}
                initial={{ opacity: 0.85, scaleY: 0.35 }}
                animate={{ opacity: 0, scaleY: 1 }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                aria-hidden="true"
              />

              <div className="crt-content relative z-[3] flex h-full flex-col px-7 py-8 sm:px-16 sm:py-14 md:px-24 md:py-20">
                {/* Logo arrives first; chrome then prints in two paired beats —
                    top corners together, then bottom corners — for a clearer
                    "boot log" rhythm than 4 simultaneous typewriters. */}
                <div className="boot-corner flex items-start justify-between gap-4 leading-tight">
                  <div className="text-left">
                    <TypedText text="ANonABento" className="block text-white/85" startDelay={950} speed={30} />
                    <TypedText text="v1.0.0" className="mt-1 block text-white/45" startDelay={950} speed={30} />
                  </div>
                  <div className="text-right">
                    <TypedText text="BOOT" className="block text-white" startDelay={950} speed={30} />
                    <TypedText text="CRT MODE" className="mt-1 block text-[var(--purple)]" startDelay={950} speed={30} />
                  </div>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center gap-14 pb-2 pt-4 sm:gap-24">
                  <div className="flex flex-col items-center gap-5">
                    <div className="boot-title-row inline-flex items-start justify-center">
                      {/* Logo arrives first — snaps in (scale + fade) right
                          after the shutters retract. The chrome / subtitle
                          then "print" themselves *around* the brand mark. */}
                      <motion.h1
                        className="boot-title boot-title-text relative"
                        aria-label="bentOS"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      >
                        bentOS
                      </motion.h1>
                      <motion.div
                        className="boot-title-logo hidden sm:block"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <div className="boot-logo-mark relative w-full h-full">
                          <BentoIcon size={120} className="w-full h-full" />
                        </div>
                      </motion.div>
                    </div>
                    <p
                      className="font-crt uppercase text-white whitespace-nowrap text-[0.85rem] tracking-[0.34em] sm:text-base sm:tracking-[0.4em] md:text-lg"
                    >
                      <span className="sr-only">ANONABENTO PORTFOLIO WEBSITE</span>
                      <Typewriter
                        text="ANONABENTO PORTFOLIO WEBSITE"
                        startDelay={1550}
                        speed={28}
                      />
                    </p>
                  </div>

                  <div className="relative flex w-full max-w-[760px] flex-col items-stretch gap-5 min-h-[120px] sm:min-h-[136px]">
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
                          <div
                            className="mb-4 self-start uppercase text-left text-base tracking-[0.22em] text-white sm:text-xl sm:tracking-[0.22em]"
                          >
                            <span className="sr-only">{bootStatus.progressLabel}</span>
                            <Typewriter
                              text={bootStatus.progressLabel}
                              speed={32}
                            />
                          </div>
                          <div className="flex items-center gap-7 sm:gap-10">
                            <div
                              className="grid flex-1 gap-2 sm:gap-[10px]"
                              style={{ gridTemplateColumns: `repeat(${SEGMENT_COUNT}, minmax(0, 1fr))` }}
                            >
                              {Array.from({ length: SEGMENT_COUNT }).map((_, index) => {
                                const isOn = index < filledSegments;
                                return (
                                  <div
                                    key={index}
                                    className="h-[22px] border border-black/60 transition-all duration-200 sm:h-[26px]"
                                    style={{
                                      backgroundImage: isOn
                                        ? 'repeating-linear-gradient(0deg, rgba(255,255,255,0.11) 0, rgba(255,255,255,0.11) 1px, transparent 1px, transparent 3px)'
                                        : 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)',
                                      backgroundColor: isOn ? 'var(--orange)' : 'rgba(53, 61, 64, 0.48)',
                                      boxShadow: isOn
                                        ? '0 0 9px rgba(244, 122, 32, 0.36), inset 0 0 9px rgba(255, 255, 255, 0.08)'
                                        : 'inset 0 0 9px rgba(0, 0, 0, 0.62)',
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <span className="font-crt min-w-[5ch] pl-1 text-right uppercase text-2xl tracking-[0.04em] text-white sm:text-3xl">
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

                <div className="boot-corner flex items-end justify-between text-white">
                  <TypedText text="SYS 05.07.26" startDelay={1250} speed={30} />
                  <TypedText text="INTERFACE READY" startDelay={1250} speed={30} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
