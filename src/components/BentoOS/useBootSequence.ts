'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type BootPhase = 'logo' | 'loading' | 'full' | 'ready' | 'done';

const SEGMENT_COUNT = 16;
const SEGMENTS_PER_MODULE = 6;
const LOGO_FADE_DELAY = 300;
const ROLL_STAGGER = 60;
const MIN_DISPLAY_MS = 800;
const FULL_HOLD_MS = 500;

const PRELOAD_MODULES = [
  () => import('@/components/Viewfinder'),
  () => import('@/components/Chat'),
  () => import('@/components/Skills/SkillsSection'),
];

export function useBootSequence({ onExiting }: { onExiting: () => void }) {
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
        } else if (loadedCountRef.current >= PRELOAD_MODULES.length) {
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

  const onModuleLoaded = useCallback(() => {
    loadedCountRef.current += 1;
    fillQueueRef.current.push(
      Math.min(loadedCountRef.current * SEGMENTS_PER_MODULE, SEGMENT_COUNT)
    );
    processFillQueue();
  }, [processFillQueue]);

  const completeBoot = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    setPhase('done');
    setShowFlash(true);

    window.setTimeout(() => setShowFlash(false), 120);
    window.setTimeout(() => onExiting(), 150);
    window.setTimeout(() => setIsVisible(false), 200);
  }, [onExiting]);

  useEffect(() => {
    if (phase !== 'loading') {
      return;
    }

    barStartTimeRef.current = Date.now();

    PRELOAD_MODULES.forEach((loadModule) => {
      loadModule()
        .catch(() => {})
        .finally(() => onModuleLoaded());
    });
  }, [onModuleLoaded, phase]);

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

  return {
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
