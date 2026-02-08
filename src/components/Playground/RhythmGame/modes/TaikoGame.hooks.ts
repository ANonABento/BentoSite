'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameState } from '../../Playground.hooks';
import {
  TaikoBeatMap,
  TaikoNote,
  TaikoNoteType,
  TIMING_WINDOWS,
  SCORING,
  TAIKO_DIMENSIONS,
  KEY_BINDINGS,
} from './TaikoGame.config';

interface ActiveTaikoNote extends TaikoNote {
  spawnTime: number;
  hit: boolean;
  rating?: 'perfect' | 'good' | 'miss';
}

interface TaikoGameState {
  activeNotes: ActiveTaikoNote[];
  score: number;
  combo: number;
  maxCombo: number;
  perfects: number;
  goods: number;
  misses: number;
  lastHitType: TaikoNoteType | null;
  lastHitRating: 'perfect' | 'good' | 'miss' | null;
}

interface TaikoResult {
  score: number;
  maxCombo: number;
  perfects: number;
  goods: number;
  misses: number;
  accuracy: number;
}

export function useTaikoGame(beatMap: TaikoBeatMap) {
  const gameState = useGameState(1);
  const [state, setState] = useState<TaikoGameState>({
    activeNotes: [],
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    goods: 0,
    misses: 0,
    lastHitType: null,
    lastHitRating: null,
  });
  const [result, setResult] = useState<TaikoResult | null>(null);
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
      goods: 0,
      misses: 0,
      lastHitType: null,
      lastHitRating: null,
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
      const totalHits = prev.perfects + prev.goods + prev.misses;
      const accuracy =
        totalHits > 0
          ? Math.round(
              ((prev.perfects * 100 + prev.goods * 50) / (totalHits * 100)) * 100
            )
          : 0;

      setResult({
        score: prev.score,
        maxCombo: prev.maxCombo,
        perfects: prev.perfects,
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
        beatMap.notes[noteIndexRef.current].time - TAIKO_DIMENSIONS.approachTime <= elapsed
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
          (note) => now - note.time < 1000 || !note.hit
        );

        return {
          ...prev,
          activeNotes: filteredNotes,
          combo: newCombo,
          misses: newMisses,
          maxCombo: Math.max(prev.maxCombo, newCombo),
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

  // Handle drum hit
  const handleHit = useCallback((hitType: TaikoNoteType) => {
    if (!startTimeRef.current) return;

    const elapsed = performance.now() - startTimeRef.current;

    setState((prev) => {
      // Find the closest unhit note of the correct type
      const hittableNotes = prev.activeNotes.filter(
        (n) =>
          !n.hit &&
          n.noteType === hitType &&
          Math.abs(elapsed - n.time) < TIMING_WINDOWS.miss
      );

      if (hittableNotes.length === 0) {
        // No note to hit - just animate the drum
        return {
          ...prev,
          lastHitType: hitType,
          lastHitRating: null,
        };
      }

      // Hit the closest one
      const closest = hittableNotes.reduce((a, b) =>
        Math.abs(elapsed - a.time) < Math.abs(elapsed - b.time) ? a : b
      );

      const timingOffset = Math.abs(elapsed - closest.time);

      let rating: 'perfect' | 'good' | 'miss';
      let scoreGain = 0;

      if (timingOffset <= TIMING_WINDOWS.perfect) {
        rating = 'perfect';
        scoreGain = SCORING.perfect;
      } else if (timingOffset <= TIMING_WINDOWS.good) {
        rating = 'good';
        scoreGain = SCORING.good;
      } else {
        rating = 'miss';
        scoreGain = 0;
      }

      // Large notes give double score
      if (closest.large) {
        scoreGain *= 2;
      }

      const newCombo = rating === 'miss' ? 0 : prev.combo + 1;
      const comboMultiplier = Math.min(1 + prev.combo * 0.1, 4);
      const finalScore = Math.round(scoreGain * comboMultiplier);

      const activeNotes = prev.activeNotes.map((n) =>
        n.id === closest.id ? { ...n, hit: true, rating } : n
      );

      return {
        ...prev,
        activeNotes,
        score: prev.score + finalScore,
        combo: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo),
        perfects: prev.perfects + (rating === 'perfect' ? 1 : 0),
        goods: prev.goods + (rating === 'good' ? 1 : 0),
        misses: prev.misses + (rating === 'miss' ? 1 : 0),
        lastHitType: hitType,
        lastHitRating: rating,
      };
    });
  }, []);

  // Keyboard handler
  useEffect(() => {
    if (gameState.status !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (KEY_BINDINGS.don.includes(e.key)) {
        handleHit('don');
      } else if (KEY_BINDINGS.kat.includes(e.key)) {
        handleHit('kat');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, handleHit]);

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
      goods: 0,
      misses: 0,
      lastHitType: null,
      lastHitRating: null,
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
    handleHit,
    resetGame,
    getCurrentTime,
  };
}
