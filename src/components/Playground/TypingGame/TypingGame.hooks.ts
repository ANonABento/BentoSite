'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameState } from '../Playground.hooks';
import { TypingDifficulty, TypingDuration, TypingResult } from '../Playground.types';
import { generateTypingText } from '../Playground.config';
import { calculateWPM, calculateAccuracy } from '../Playground.utils';

interface TypingGameState {
  text: string;
  currentIndex: number;
  correctCount: number;
  errorCount: number;
  errorIndices: Set<number>;
}

export function useTypingGame(
  duration: TypingDuration = 60,
  difficulty: TypingDifficulty = 'medium'
) {
  const gameState = useGameState(1);
  const [state, setState] = useState<TypingGameState>({
    text: '',
    currentIndex: 0,
    correctCount: 0,
    errorCount: 0,
    errorIndices: new Set(),
  });
  const [result, setResult] = useState<TypingResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate final result - defined early so it can be used by other callbacks
  const doCalculateResult = useCallback(() => {
    if (!startTimeRef.current) return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const wpm = calculateWPM(state.correctCount, elapsed);
    const accuracy = calculateAccuracy(
      state.correctCount,
      state.correctCount + state.errorCount
    );

    const res: TypingResult = {
      wpm,
      accuracy,
      correctChars: state.correctCount,
      totalChars: state.currentIndex,
      duration,
      difficulty,
      date: new Date().toISOString(),
    };
    setResult(res);
  }, [state.correctCount, state.errorCount, state.currentIndex, duration, difficulty]);

  // Update elapsed time for live stats
  useEffect(() => {
    if (gameState.status !== 'playing' || !startTimeRef.current) {
      return;
    }

    const interval = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setElapsedSeconds(elapsed);
        const remaining = Math.max(0, duration - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          gameState.finishGame();
          doCalculateResult();
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        }
      }
    }, 100);

    timerRef.current = interval;

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState.status, duration, gameState, doCalculateResult]);

  // Generate text and start
  const startGame = useCallback(() => {
    const text = generateTypingText(difficulty, 100);
    setState({
      text,
      currentIndex: 0,
      correctCount: 0,
      errorCount: 0,
      errorIndices: new Set(),
    });
    setResult(null);
    setTimeLeft(duration);
    setElapsedSeconds(0);
    startTimeRef.current = null;
    gameState.startGame();
  }, [difficulty, duration, gameState]);

  // Called when countdown finishes
  const startPlaying = useCallback(() => {
    gameState.startPlaying();
    startTimeRef.current = Date.now();
    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [gameState]);

  // Handle key input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (gameState.status !== 'playing') return;

      // Start timer on first keystroke
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      const key = e.key;

      // Only process printable characters
      if (key.length !== 1) return;

      const expectedChar = state.text[state.currentIndex];

      if (key === expectedChar) {
        setState((prev) => ({
          ...prev,
          currentIndex: prev.currentIndex + 1,
          correctCount: prev.correctCount + 1,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          currentIndex: prev.currentIndex + 1,
          errorCount: prev.errorCount + 1,
          errorIndices: new Set([...prev.errorIndices, prev.currentIndex]),
        }));
      }

      // Check if reached end of text
      if (state.currentIndex + 1 >= state.text.length) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        gameState.finishGame();
        doCalculateResult();
      }
    },
    [gameState, state, doCalculateResult]
  );

  // Reset game
  const resetGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setState({
      text: '',
      currentIndex: 0,
      correctCount: 0,
      errorCount: 0,
      errorIndices: new Set(),
    });
    setResult(null);
    setElapsedSeconds(0);
    setTimeLeft(duration);
    startTimeRef.current = null;
    gameState.resetGame();
  }, [duration, gameState]);

  // Calculate live WPM
  const liveWPM =
    elapsedSeconds > 0 && state.correctCount > 0
      ? calculateWPM(state.correctCount, elapsedSeconds)
      : 0;

  // Calculate live accuracy
  const liveAccuracy =
    state.currentIndex > 0
      ? calculateAccuracy(state.correctCount, state.currentIndex)
      : 100;

  return {
    ...gameState,
    text: state.text,
    currentIndex: state.currentIndex,
    errorIndices: state.errorIndices,
    timeLeft,
    formattedTime: formatTime(timeLeft),
    liveWPM,
    liveAccuracy,
    result,
    inputRef,
    startGame,
    startPlaying,
    handleKeyDown,
    resetGame,
  };
}
