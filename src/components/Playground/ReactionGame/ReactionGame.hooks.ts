'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameState } from '../Playground.hooks';
import { ReactionRound } from '../Playground.types';
import { REACTION_CONFIG } from '../Playground.config';
import { randomInt } from '../Playground.utils';

type ReactionPhase = 'waiting' | 'ready' | 'clicked' | 'tooEarly';

export function useReactionGame() {
  const gameState = useGameState(REACTION_CONFIG.totalRounds);
  const [phase, setPhase] = useState<ReactionPhase>('waiting');
  const [rounds, setRounds] = useState<ReactionRound[]>([]);

  const greenTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roundCountRef = useRef(0);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Start a new round
  const startRound = useCallback(() => {
    setPhase('waiting');
    greenTimeRef.current = null;

    // Random delay before showing green
    const delay = randomInt(REACTION_CONFIG.minDelay, REACTION_CONFIG.maxDelay);

    timeoutRef.current = setTimeout(() => {
      setPhase('ready');
      greenTimeRef.current = performance.now();
    }, delay);
  }, []);

  // Start the game
  const startGame = useCallback(() => {
    setRounds([]);
    roundCountRef.current = 0;
    gameState.startGame();
  }, [gameState]);

  // Called when countdown finishes
  const startPlaying = useCallback(() => {
    gameState.startPlaying();
    startRound();
  }, [gameState, startRound]);

  // Handle click
  const handleClick = useCallback(() => {
    if (phase === 'waiting') {
      // Clicked too early
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setPhase('tooEarly');
      roundCountRef.current += 1;

      // Record penalty round
      setRounds((prev) => [
        ...prev,
        { reactionTime: -1, timestamp: Date.now() },
      ]);
    } else if (phase === 'ready') {
      // Calculate reaction time
      const reactionTime = greenTimeRef.current
        ? performance.now() - greenTimeRef.current
        : 0;

      setPhase('clicked');
      roundCountRef.current += 1;
      setRounds((prev) => [
        ...prev,
        { reactionTime: Math.round(reactionTime), timestamp: Date.now() },
      ]);

      // Wait a moment then check if game should continue
      setTimeout(() => {
        if (roundCountRef.current >= REACTION_CONFIG.totalRounds) {
          gameState.finishGame();
        } else {
          gameState.nextRound();
          startRound();
        }
      }, 1500);
    } else if (phase === 'tooEarly') {
      // Continue after too early click
      if (roundCountRef.current >= REACTION_CONFIG.totalRounds) {
        gameState.finishGame();
      } else {
        gameState.nextRound();
        startRound();
      }
    } else if (phase === 'clicked') {
      // Already clicked, waiting for transition
    }
  }, [phase, gameState, startRound]);

  // Reset game
  const resetGame = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setPhase('waiting');
    setRounds([]);
    roundCountRef.current = 0;
    greenTimeRef.current = null;
    gameState.resetGame();
  }, [gameState]);

  return {
    ...gameState,
    phase,
    rounds,
    startGame,
    startPlaying,
    handleClick,
    resetGame,
  };
}
