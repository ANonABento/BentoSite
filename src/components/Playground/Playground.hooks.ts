'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, StoredScores } from './Playground.types';
import { STORAGE_KEYS } from './Playground.config';

/**
 * Game state machine hook
 */
export function useGameState(totalRounds: number = 1) {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [round, setRound] = useState(0);

  const startGame = useCallback(() => {
    setStatus('countdown');
    setRound(1);
  }, []);

  const startPlaying = useCallback(() => {
    setStatus('playing');
  }, []);

  const nextRound = useCallback(() => {
    if (round >= totalRounds) {
      setStatus('finished');
    } else {
      setRound((r) => r + 1);
      setStatus('countdown');
    }
  }, [round, totalRounds]);

  const finishGame = useCallback(() => {
    setStatus('finished');
  }, []);

  const resetGame = useCallback(() => {
    setStatus('idle');
    setRound(0);
  }, []);

  return {
    status,
    round,
    totalRounds,
    startGame,
    startPlaying,
    nextRound,
    finishGame,
    resetGame,
    isIdle: status === 'idle',
    isCountdown: status === 'countdown',
    isPlaying: status === 'playing',
    isFinished: status === 'finished',
  };
}

/**
 * Countdown timer hook
 */
export function useCountdown(
  initialSeconds: number,
  onComplete?: () => void
) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setSeconds(initialSeconds);
  }, [stop, initialSeconds]);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0 && isRunning) {
      setIsRunning(false);
      onComplete?.();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, seconds, onComplete]);

  return {
    seconds,
    isRunning,
    start,
    stop,
    reset,
  };
}

/**
 * High scores storage hook
 */
export function useHighScores<T extends keyof StoredScores>(gameId: T) {
  const [scores, setScores] = useState<StoredScores[T] | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load scores from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.highScores);
      if (stored) {
        const allScores: Partial<StoredScores> = JSON.parse(stored);
        setScores(allScores[gameId] ?? null);
      }
    } catch {
      console.warn('Failed to load high scores');
    }
    setIsLoaded(true);
  }, [gameId]);

  // Save scores to localStorage
  const saveScore = useCallback(
    (newScore: StoredScores[T]) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.highScores);
        const allScores: Partial<StoredScores> = stored ? JSON.parse(stored) : {};
        allScores[gameId] = newScore;
        localStorage.setItem(STORAGE_KEYS.highScores, JSON.stringify(allScores));
        setScores(newScore);
      } catch {
        console.warn('Failed to save high scores');
      }
    },
    [gameId]
  );

  return {
    scores,
    isLoaded,
    saveScore,
  };
}

/**
 * Timer hook for games with time limits
 */
export function useTimer(durationSeconds: number, onEnd?: () => void) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isActive, setIsActive] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsActive(true);
    setTimeLeft(durationSeconds);
  }, [durationSeconds]);

  const stop = useCallback(() => {
    setIsActive(false);
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTimeLeft(durationSeconds);
    startTimeRef.current = null;
  }, [durationSeconds, stop]);

  useEffect(() => {
    if (!isActive || !startTimeRef.current) return;

    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current!) / 1000;
      const remaining = Math.max(0, durationSeconds - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsActive(false);
        onEnd?.();
      } else {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isActive, durationSeconds, onEnd]);

  return {
    timeLeft,
    isActive,
    start,
    stop,
    reset,
    formattedTime: formatTime(timeLeft),
  };
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Detect mobile device
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
