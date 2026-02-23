'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameState } from '../../Playground.hooks';
import {
  ManiaBeatMap,
  ManiaNote,
  TIMING_WINDOWS,
  SCORING,
  MANIA_DIMENSIONS,
  KEY_BINDINGS,
} from './ManiaGame.config';

interface ActiveManiaNote extends ManiaNote {
  spawnTime: number;
  hit: boolean;
  rating?: 'perfect' | 'great' | 'good' | 'miss';
  holdActive?: boolean;
  holdProgress?: number;
}

interface ManiaGameState {
  activeNotes: ActiveManiaNote[];
  score: number;
  combo: number;
  maxCombo: number;
  perfects: number;
  greats: number;
  goods: number;
  misses: number;
  pressedKeys: Set<number>;
  keyFlash: number[]; // Lanes that were just pressed
}

interface ManiaResult {
  score: number;
  maxCombo: number;
  perfects: number;
  greats: number;
  goods: number;
  misses: number;
  accuracy: number;
}

export function useManiaGame(beatMap: ManiaBeatMap) {
  const gameState = useGameState(1);
  const [state, setState] = useState<ManiaGameState>({
    activeNotes: [],
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    greats: 0,
    goods: 0,
    misses: 0,
    pressedKeys: new Set(),
    keyFlash: [],
  });
  const [result, setResult] = useState<ManiaResult | null>(null);
  const [progress, setProgress] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const noteIndexRef = useRef(0);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setState({
      activeNotes: [],
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfects: 0,
      greats: 0,
      goods: 0,
      misses: 0,
      pressedKeys: new Set(),
      keyFlash: [],
    });
    setResult(null);
    setProgress(0);
    noteIndexRef.current = 0;
    startTimeRef.current = null;
    gameState.startGame();
  }, [gameState]);

  // Finish game
  const finishGame = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    gameState.finishGame();

    setState((prev) => {
      const totalHits = prev.perfects + prev.greats + prev.goods + prev.misses;
      const accuracy =
        totalHits > 0
          ? Math.round(
              ((prev.perfects * 100 + prev.greats * 80 + prev.goods * 50) / (totalHits * 100)) * 100
            )
          : 0;

      setResult({
        score: prev.score,
        maxCombo: prev.maxCombo,
        perfects: prev.perfects,
        greats: prev.greats,
        goods: prev.goods,
        misses: prev.misses,
        accuracy,
      });

      return prev;
    });
  }, [gameState]);

  // Start playing after countdown
  const startPlaying = useCallback(() => {
    gameState.startPlaying();
    startTimeRef.current = performance.now();

    const gameLoop = () => {
      if (!startTimeRef.current) return;

      const elapsed = performance.now() - startTimeRef.current;
      const totalDuration = beatMap.duration * 1000;

      // Update progress
      setProgress(Math.min(elapsed / totalDuration, 1));

      // Spawn new notes
      while (
        noteIndexRef.current < beatMap.notes.length &&
        beatMap.notes[noteIndexRef.current].time - MANIA_DIMENSIONS.approachTime <= elapsed
      ) {
        const note = beatMap.notes[noteIndexRef.current];
        setState((prev) => ({
          ...prev,
          activeNotes: [
            ...prev.activeNotes,
            { ...note, spawnTime: performance.now(), hit: false },
          ],
        }));
        noteIndexRef.current++;
      }

      // Check for missed notes
      setState((prev) => {
        const now = elapsed;
        let newCombo = prev.combo;
        let newMisses = prev.misses;

        const activeNotes = prev.activeNotes.map((note) => {
          if (!note.hit && now > note.time + TIMING_WINDOWS.miss) {
            newCombo = 0;
            newMisses++;
            return { ...note, hit: true, rating: 'miss' as const };
          }
          return note;
        });

        // Remove old notes that have scrolled past
        const filteredNotes = activeNotes.filter(
          (note) => now - note.time < 500 || !note.hit
        );

        // Clear key flash after a short time
        const keyFlash = prev.keyFlash.filter(() => false);

        return {
          ...prev,
          activeNotes: filteredNotes,
          combo: newCombo,
          misses: newMisses,
          maxCombo: Math.max(prev.maxCombo, newCombo),
          keyFlash,
        };
      });

      // Check if game is over
      if (elapsed >= totalDuration) {
        finishGame();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [beatMap, gameState, finishGame]);

  // Handle key press
  const handleKeyPress = useCallback((lane: number) => {
    if (!startTimeRef.current) return;

    const elapsed = performance.now() - startTimeRef.current;

    setState((prev) => {
      // Find the closest unhit note in this lane
      const hittableNotes = prev.activeNotes.filter(
        (n) =>
          !n.hit &&
          n.lane === lane &&
          Math.abs(elapsed - n.time) < TIMING_WINDOWS.miss
      );

      // Add key flash
      const keyFlash = [...prev.keyFlash, lane];

      if (hittableNotes.length === 0) {
        return {
          ...prev,
          pressedKeys: new Set([...prev.pressedKeys, lane]),
          keyFlash,
        };
      }

      // Hit the closest one
      const closest = hittableNotes.reduce((a, b) =>
        Math.abs(elapsed - a.time) < Math.abs(elapsed - b.time) ? a : b
      );

      const timingOffset = Math.abs(elapsed - closest.time);

      let rating: 'perfect' | 'great' | 'good' | 'miss';
      let scoreGain = 0;

      if (timingOffset <= TIMING_WINDOWS.perfect) {
        rating = 'perfect';
        scoreGain = SCORING.perfect;
      } else if (timingOffset <= TIMING_WINDOWS.great) {
        rating = 'great';
        scoreGain = SCORING.great;
      } else if (timingOffset <= TIMING_WINDOWS.good) {
        rating = 'good';
        scoreGain = SCORING.good;
      } else {
        rating = 'miss';
        scoreGain = 0;
      }

      const newCombo = rating === 'miss' ? 0 : prev.combo + 1;
      const comboMultiplier = Math.min(1 + prev.combo * 0.05, 2);
      const finalScore = Math.round(scoreGain * comboMultiplier);

      const activeNotes = prev.activeNotes.map((n) =>
        n.id === closest.id
          ? { ...n, hit: true, rating, holdActive: closest.holdDuration ? true : undefined }
          : n
      );

      return {
        ...prev,
        activeNotes,
        score: prev.score + finalScore,
        combo: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo),
        perfects: prev.perfects + (rating === 'perfect' ? 1 : 0),
        greats: prev.greats + (rating === 'great' ? 1 : 0),
        goods: prev.goods + (rating === 'good' ? 1 : 0),
        misses: prev.misses + (rating === 'miss' ? 1 : 0),
        pressedKeys: new Set([...prev.pressedKeys, lane]),
        keyFlash,
      };
    });
  }, []);

  // Handle key release
  const handleKeyRelease = useCallback((lane: number) => {
    setState((prev) => ({
      ...prev,
      pressedKeys: new Set([...prev.pressedKeys].filter((k) => k !== lane)),
    }));
  }, []);

  // Keyboard handler
  useEffect(() => {
    if (gameState.status !== 'playing') return;

    const keys = KEY_BINDINGS[beatMap.keyCount];

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const lane = keys.indexOf(key);
      if (lane !== -1 && !e.repeat) {
        handleKeyPress(lane);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const lane = keys.indexOf(key);
      if (lane !== -1) {
        handleKeyRelease(lane);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.status, beatMap.keyCount, handleKeyPress, handleKeyRelease]);

  // Reset game
  const resetGame = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setState({
      activeNotes: [],
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfects: 0,
      greats: 0,
      goods: 0,
      misses: 0,
      pressedKeys: new Set(),
      keyFlash: [],
    });
    setResult(null);
    setProgress(0);
    noteIndexRef.current = 0;
    startTimeRef.current = null;
    gameState.resetGame();
  }, [gameState]);

  // Get current game time
  const getCurrentTime = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return performance.now() - startTimeRef.current;
  }, []);

  return {
    ...gameState,
    ...state,
    result,
    progress,
    startGame,
    startPlaying,
    handleKeyPress,
    handleKeyRelease,
    resetGame,
    getCurrentTime,
  };
}
