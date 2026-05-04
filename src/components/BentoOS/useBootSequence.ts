'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type BootPhase = 'logo' | 'loading' | 'full' | 'ready' | 'done';

const SEGMENT_COUNT = 16;
const SEGMENTS_PER_MODULE = 6;
const LOGO_FADE_DELAY = 300;
const ROLL_STAGGER = 60;
const MIN_DISPLAY_MS = 800;
const FULL_HOLD_MS = 500;
const BOOT_PROGRESS_TARGETS = [6, 12, SEGMENT_COUNT];
const AUTO_ADVANCE_MS = 2000;

export function useBootSequence({ onExiting }: { onExiting: () => void }) {
  const [phase, setPhase] = useState<BootPhase>('logo');
  const [filledSegments, setFilledSegments] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const [glitchOffset, setGlitchOffset] = useState(0);
  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
  const completedRef = useRef(false);
  const progressCountRef = useRef(0);
  const barStartTimeRef = useRef(0);
  const fillQueueRef = useRef<number[]>([]);
  const fillingRef = useRef(false);
  const autoAdvanceRafRef = useRef<number | null>(null);

  const cancelAutoAdvance = useCallback(() => {
    if (autoAdvanceRafRef.current !== null) {
      window.cancelAnimationFrame(autoAdvanceRafRef.current);
      autoAdvanceRafRef.current = null;
    }
  }, []);

  const triggerCrtTransition = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    setShowFlash(true);
    setGlitchOffset(4);

    window.setTimeout(() => setGlitchOffset(-3), 50);
    window.setTimeout(() => {
      if (completedRef.current) {
        return;
      }
      setGlitchOffset(2);
      setPhase('ready');
    }, 100);
    window.setTimeout(() => setGlitchOffset(0), 150);
    window.setTimeout(() => setShowFlash(false), 200);
  }, []);

  const transitionToReady = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    const elapsed = Date.now() - barStartTimeRef.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    window.setTimeout(() => {
      if (completedRef.current) {
        return;
      }

      setPhase('full');

      window.setTimeout(() => {
        if (!completedRef.current) {
          triggerCrtTransition();
        }
      }, FULL_HOLD_MS);
    }, remaining);
  }, [triggerCrtTransition]);

  const processFillQueue = useCallback(function processQueue() {
    if (fillingRef.current || completedRef.current) {
      return;
    }

    const targetSegment = fillQueueRef.current[0];
    if (targetSegment === undefined) {
      return;
    }

    fillingRef.current = true;

    const fillNext = (current: number) => {
      if (current >= targetSegment || completedRef.current) {
        fillingRef.current = false;
        fillQueueRef.current.shift();

        if (fillQueueRef.current.length > 0) {
          processQueue();
        } else if (progressCountRef.current >= BOOT_PROGRESS_TARGETS.length) {
          transitionToReady();
        }

        return;
      }

      setFilledSegments(current + 1);
      window.setTimeout(() => fillNext(current + 1), ROLL_STAGGER);
    };

    setFilledSegments((previousFilled) => {
      fillNext(previousFilled);
      return previousFilled;
    });
  }, [transitionToReady]);

  const advanceBootProgress = useCallback(() => {
    const targetSegment = BOOT_PROGRESS_TARGETS[progressCountRef.current];
    if (targetSegment === undefined) {
      return;
    }

    progressCountRef.current += 1;
    fillQueueRef.current.push(targetSegment);
    processFillQueue();
  }, [processFillQueue]);

  const completeBoot = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    cancelAutoAdvance();
    setPhase('done');
    setShowFlash(true);

    window.setTimeout(() => setShowFlash(false), 120);
    window.setTimeout(() => onExiting(), 150);
    window.setTimeout(() => setIsVisible(false), 200);
  }, [cancelAutoAdvance, onExiting]);

  useEffect(() => {
    if (phase !== 'loading') {
      return;
    }

    barStartTimeRef.current = Date.now();

    const timers = BOOT_PROGRESS_TARGETS.map((_, index) => {
      return window.setTimeout(() => advanceBootProgress(), index * SEGMENTS_PER_MODULE * 20);
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [advanceBootProgress, phase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!completedRef.current) {
        setPhase('loading');
      }
    }, LOGO_FADE_DELAY + 400);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if ((phase !== 'ready' && phase !== 'full') || completedRef.current) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        completeBoot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completeBoot, phase]);

  useEffect(() => {
    if (phase !== 'ready' || completedRef.current) {
      return;
    }

    const startedAt = performance.now();

    const tick = (now: number) => {
      if (completedRef.current) {
        autoAdvanceRafRef.current = null;
        return;
      }

      const elapsed = now - startedAt;
      const ratio = Math.min(1, elapsed / AUTO_ADVANCE_MS);
      setAutoAdvanceProgress(ratio);

      if (ratio >= 1) {
        autoAdvanceRafRef.current = null;
        completeBoot();
        return;
      }

      autoAdvanceRafRef.current = window.requestAnimationFrame(tick);
    };

    autoAdvanceRafRef.current = window.requestAnimationFrame(tick);

    return () => {
      cancelAutoAdvance();
    };
  }, [cancelAutoAdvance, completeBoot, phase]);

  return {
    autoAdvanceProgress,
    completeBoot,
    filledSegments,
    glitchOffset,
    isBarPhase: phase === 'loading' || phase === 'full',
    isSkippable: phase === 'ready' || phase === 'full',
    isVisible,
    phase,
    showFlash,
  };
}
