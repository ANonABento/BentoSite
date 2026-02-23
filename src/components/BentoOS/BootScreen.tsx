'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BentoIcon } from './BentoIcon';

interface BootScreenProps {
  /** Called when exit begins — parent should start mounting dashboard underneath */
  onExiting: () => void;
  /** Called when exit animation finishes — parent can unmount boot screen */
  onComplete: () => void;
}

type BootPhase = 'logo' | 'loading' | 'full' | 'ready' | 'done';

const SEGMENT_COUNT = 16;
const SEGMENTS_PER_MODULE = 6;
const LOGO_FADE_DELAY = 300;
const ROLL_STAGGER = 60;
const MIN_DISPLAY_MS = 800;
const FULL_HOLD_MS = 500;
const TYPEWRITER_SPEED = 35;

const PRELOAD_MODULES = [
  () => import('@/components/Viewfinder'),
  () => import('@/components/Chat'),
  () => import('@/components/Skills/SkillsSection'),
];

// Terminal prompt with typewriter effect and blinking cursor on second line
function TerminalPrompt() {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  const fullText = 'initialized - press any key:';

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(timer);
        setTimeout(() => setShowCursor(true), 150);
      }
    }, TYPEWRITER_SPEED);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="font-mono text-xs text-[var(--orange)] tracking-wider whitespace-nowrap text-left">
      <div className="flex items-center">
        <span className="text-[var(--text-muted)] mr-1">&gt;</span>
        <span>{displayedText}</span>
        {!showCursor && displayedText.length < fullText.length && (
          <span className="animate-pulse">_</span>
        )}
      </div>
      {showCursor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="mt-1"
        >
          <span className="animate-blink">_</span>
        </motion.div>
      )}
    </div>
  );
}

export function BootScreen({ onExiting, onComplete }: BootScreenProps) {
  const [phase, setPhase] = useState<BootPhase>('logo');
  const [filledSegments, setFilledSegments] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const [glitchOffset, setGlitchOffset] = useState(0);
  const completedRef = useRef(false);
  const loadedCountRef = useRef(0);
  const barStartTimeRef = useRef(0);
  const fillQueueRef = useRef<number[]>([]);
  const fillingRef = useRef(false);

  // CRT glitch: flash + horizontal jitter, swap content at peak
  const triggerCRTTransition = useCallback(() => {
    if (completedRef.current) return;

    // Start flash + glitch jitter
    setShowFlash(true);
    setGlitchOffset(4);

    // Jitter: shift opposite direction
    setTimeout(() => setGlitchOffset(-3), 50);

    // At flash peak (~100ms): swap content to terminal
    setTimeout(() => {
      if (completedRef.current) return;
      setGlitchOffset(2);
      setPhase('ready');
    }, 100);

    // Settle jitter
    setTimeout(() => setGlitchOffset(0), 150);

    // Fade flash out
    setTimeout(() => setShowFlash(false), 200);
  }, []);

  // Chain: loading complete → full (hold) → CRT flash → ready
  const transitionToReady = useCallback(() => {
    if (completedRef.current) return;
    const elapsed = Date.now() - barStartTimeRef.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    setTimeout(() => {
      if (completedRef.current) return;
      setPhase('full');

      setTimeout(() => {
        if (completedRef.current) return;
        triggerCRTTransition();
      }, FULL_HOLD_MS);
    }, remaining);
  }, [triggerCRTTransition]);

  const processFillQueueRef = useRef<(() => void) | undefined>(undefined);

  const processFillQueue = useCallback(() => {
    if (fillingRef.current || completedRef.current) return;
    const target = fillQueueRef.current[0];
    if (target === undefined) return;

    fillingRef.current = true;

    const fillNext = (current: number) => {
      if (current >= target || completedRef.current) {
        fillingRef.current = false;
        fillQueueRef.current.shift();
        if (fillQueueRef.current.length > 0) {
          processFillQueueRef.current?.();
        } else if (loadedCountRef.current >= PRELOAD_MODULES.length) {
          transitionToReady();
        }
        return;
      }
      setFilledSegments(current + 1);
      setTimeout(() => fillNext(current + 1), ROLL_STAGGER);
    };

    setFilledSegments((prev) => {
      fillNext(prev);
      return prev;
    });
  }, [transitionToReady]);

  useEffect(() => {
    processFillQueueRef.current = processFillQueue;
  });

  const onModuleLoaded = useCallback(() => {
    loadedCountRef.current++;
    const targetSegment = Math.min(
      loadedCountRef.current * SEGMENTS_PER_MODULE,
      SEGMENT_COUNT
    );
    fillQueueRef.current.push(targetSegment);
    processFillQueue();
  }, [processFillQueue]);

  const completeBoot = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setPhase('done');
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 120);
    // Signal parent to mount dashboard underneath for crossfade
    setTimeout(() => onExiting(), 150);
    // Trigger exit animation (600ms fade-out + scale)
    // onComplete fires via AnimatePresence onExitComplete when animation ends
    setTimeout(() => setIsVisible(false), 200);
  }, [onExiting]);

  // Start preloading modules when entering loading phase
  useEffect(() => {
    if (phase !== 'loading') return;
    barStartTimeRef.current = Date.now();

    PRELOAD_MODULES.forEach((loadFn) => {
      loadFn()
        .catch(() => {})
        .finally(() => onModuleLoaded());
    });
  }, [phase, onModuleLoaded]);

  // Transition from logo to loading phase
  useEffect(() => {
    const timer = setTimeout(() => {
      if (completedRef.current) return;
      setPhase('loading');
    }, LOGO_FADE_DELAY + 400);
    return () => clearTimeout(timer);
  }, []);

  // Allow skip during full and ready phases
  useEffect(() => {
    if ((phase !== 'ready' && phase !== 'full') || completedRef.current) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      completeBoot();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, completeBoot]);

  const isBarPhase = phase === 'loading' || phase === 'full';
  const isSkippable = phase === 'ready' || phase === 'full';

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100]"
          style={{
            background: 'radial-gradient(ellipse at center, #0f0f14 0%, #08080c 70%, #050508 100%)',
          }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          onClick={isSkippable ? completeBoot : undefined}
        >
          {/* Noise grain texture — SVG feTurbulence for CRT static */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1]" aria-hidden="true">
            <filter id="boot-noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#boot-noise)" opacity="0.03" />
          </svg>

          {/* Ambient orange glow — soft screen emission */}
          <div
            className="absolute inset-0 pointer-events-none z-[1]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(224, 123, 60, 0.025) 0%, rgba(224, 123, 60, 0.01) 40%, rgba(224, 123, 60, 0) 100%)',
            }}
          />

          <div className="relative w-full h-full grid place-items-center p-6 text-center crt-effect z-[2]">
            {/* CRT flash overlay — stronger during transition, subtle on exit */}
            <AnimatePresence>
              {showFlash && (
                <motion.div
                  className="absolute inset-0 z-10 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.08 }}
                >
                  {/* White core flash */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: phase === 'done'
                        ? 'rgba(224, 123, 60, 0.08)'
                        : 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, rgba(224, 123, 60, 0.1) 60%, transparent 100%)',
                    }}
                  />
                  {/* Scanline artifact */}
                  {phase !== 'done' && (
                    <div
                      className="absolute inset-x-0 h-[2px] animate-crt-scanline"
                      style={{
                        background: 'rgba(255, 255, 255, 0.25)',
                        boxShadow: '0 0 8px rgba(255, 255, 255, 0.15)',
                      }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content wrapper with glitch offset */}
            <div
              className="crt-content flex flex-col items-center gap-8 max-w-[90vw] transition-transform duration-75"
              style={{ transform: `translateX(${glitchOffset}px)` }}
            >
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: LOGO_FADE_DELAY / 1000, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="relative inline-block">
                  <BentoIcon size={64} className="absolute inset-0 blur-sm opacity-70" />
                  <BentoIcon size={64} />
                </div>
              </motion.div>

              {/* Brand */}
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
                  <span className="text-[var(--orange)]" style={{ textShadow: '0 0 12px rgba(224, 123, 60, 0.8), 0 0 24px rgba(224, 123, 60, 0.3)' }}>bent</span>
                  <span className="text-[var(--purple)]" style={{ textShadow: '0 0 12px rgba(167, 139, 250, 0.8), 0 0 24px rgba(167, 139, 250, 0.3)' }}>OS</span>
                </h1>
              </motion.div>

              {/* Loading bar / Terminal prompt */}
              <div className="flex flex-col items-center gap-3 min-h-[60px]">
                {/* Loading bar (loading + full phases) */}
                {isBarPhase && (
                  <motion.div
                    className="rounded-lg border border-white/10 overflow-hidden"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex gap-[2px] p-[3px]">
                      {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-3 rounded-sm transition-all duration-200"
                          style={{
                            background: i < filledSegments
                              ? 'var(--orange)'
                              : 'rgba(255, 255, 255, 0.06)',
                            boxShadow: i < filledSegments
                              ? '0 0 8px var(--orange-muted)'
                              : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Terminal prompt (ready phase — appears after CRT flash) */}
                {phase === 'ready' && (
                  <motion.div
                    className="rounded-lg border border-white/10 overflow-hidden"
                    style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                  >
                    <div className="px-4 py-3">
                      <TerminalPrompt />
                    </div>
                  </motion.div>
                )}

                {/* Version during loading/full */}
                <AnimatePresence>
                  {(phase === 'loading' || phase === 'full') && (
                    <motion.span
                      className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      v1.0
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
