'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGameState } from '../Playground.hooks';
import { BeatMap, BeatNote, HitRating, RhythmResult } from '../Playground.types';
import { APPROACH_TIME, TIMING_WINDOWS, SCORING } from './RhythmGame.config';

interface ActiveNote extends BeatNote {
  spawnTime: number;
  hit: boolean;
  rating?: HitRating;
}

interface RhythmGameState {
  activeNotes: ActiveNote[];
  score: number;
  combo: number;
  maxCombo: number;
  perfects: number;
  goods: number;
  misses: number;
}

export function useRhythmGame(beatMap: BeatMap) {
  const gameState = useGameState(1);
  const [state, setState] = useState<RhythmGameState>({
    activeNotes: [],
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    goods: 0,
    misses: 0,
  });
  const [result, setResult] = useState<RhythmResult | null>(null);
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
    });
    setResult(null);
    setProgress(0);
    noteIndexRef.current = 0;
    startTimeRef.current = null;
    gameState.startGame();
  }, [gameState]);

  // Finish game - defined before startPlaying so it can be used in the dependency array
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
        songId: beatMap.id,
        score: prev.score,
        maxCombo: prev.maxCombo,
        perfects: prev.perfects,
        goods: prev.goods,
        misses: prev.misses,
        accuracy,
      });

      return prev;
    });
  }, [beatMap.id, gameState]);

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
        beatMap.notes[noteIndexRef.current].time - APPROACH_TIME <= elapsed
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
            return { ...note, hit: true, rating: 'miss' as HitRating };
          }
          return note;
        });

        // Remove old notes
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

  // Handle click on note
  const handleNoteClick = useCallback((noteId: string) => {
    if (!startTimeRef.current) return;

    const elapsed = performance.now() - startTimeRef.current;

    setState((prev) => {
      const noteIndex = prev.activeNotes.findIndex(
        (n) => n.id === noteId && !n.hit
      );
      if (noteIndex === -1) return prev;

      const note = prev.activeNotes[noteIndex];
      const timingOffset = elapsed - note.time;
      const absOffset = Math.abs(timingOffset);

      let rating: HitRating;
      let scoreGain = 0;

      if (absOffset <= TIMING_WINDOWS.perfect) {
        rating = 'perfect';
        scoreGain = SCORING.perfect;
      } else if (absOffset <= TIMING_WINDOWS.good) {
        rating = 'good';
        scoreGain = SCORING.good;
      } else {
        rating = 'miss';
        scoreGain = 0;
      }

      const newCombo = rating === 'miss' ? 0 : prev.combo + 1;
      const comboMultiplier = Math.min(1 + prev.combo * 0.1, 4);
      const finalScore = Math.round(scoreGain * comboMultiplier);

      const activeNotes = [...prev.activeNotes];
      activeNotes[noteIndex] = { ...note, hit: true, rating };

      return {
        ...prev,
        activeNotes,
        score: prev.score + finalScore,
        combo: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo),
        perfects: prev.perfects + (rating === 'perfect' ? 1 : 0),
        goods: prev.goods + (rating === 'good' ? 1 : 0),
        misses: prev.misses + (rating === 'miss' ? 1 : 0),
      };
    });
  }, []);

  // Handle click anywhere (for mobile)
  const handlePlayfieldClick = useCallback((x: number, y: number) => {
    if (!startTimeRef.current) return;

    // Find closest unhit note
    const elapsed = performance.now() - startTimeRef.current;

    setState((prev) => {
      const clickableNotes = prev.activeNotes.filter(
        (n) =>
          !n.hit &&
          Math.abs(elapsed - n.time) < TIMING_WINDOWS.miss &&
          Math.abs(n.x - x) < 0.15 &&
          Math.abs(n.y - y) < 0.15
      );

      if (clickableNotes.length === 0) return prev;

      // Click the closest one
      const closest = clickableNotes.reduce((a, b) =>
        Math.abs(elapsed - a.time) < Math.abs(elapsed - b.time) ? a : b
      );

      const timingOffset = elapsed - closest.time;
      const absOffset = Math.abs(timingOffset);

      let rating: HitRating;
      let scoreGain = 0;

      if (absOffset <= TIMING_WINDOWS.perfect) {
        rating = 'perfect';
        scoreGain = SCORING.perfect;
      } else if (absOffset <= TIMING_WINDOWS.good) {
        rating = 'good';
        scoreGain = SCORING.good;
      } else {
        rating = 'miss';
        scoreGain = 0;
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
      };
    });
  }, []);

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
    handleNoteClick,
    handlePlayfieldClick,
    resetGame,
    getCurrentTime,
  };
}
