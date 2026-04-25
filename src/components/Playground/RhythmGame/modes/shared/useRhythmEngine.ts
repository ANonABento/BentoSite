'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameState } from '../../../Playground.hooks';
import {
  RhythmEngineActiveNote,
  RhythmEngineConfig,
  RhythmEnginePatch,
  RhythmEngineState,
} from './types';

interface RhythmEngineReturn<
  TNote extends RhythmEngineActiveNote<TRating>,
  TRating extends string,
  TInput,
  TModeState extends object,
  TResult
> {
  gameState: ReturnType<typeof useGameState>;
  activeNotes: TNote[];
  score: number;
  combo: number;
  maxCombo: number;
  ratingCounts: Record<TRating, number>;
  modeState: TModeState;
  result: TResult | null;
  progress: number;
  startGame: () => void;
  startPlaying: () => void;
  resetGame: () => void;
  handleInput: (input: TInput) => void;
  getCurrentTime: () => number;
  setModeState: (updater: TModeState | ((prev: TModeState) => TModeState)) => void;
}

function createRatingCounts<TRating extends string>(
  ratings: readonly TRating[]
): Record<TRating, number> {
  return ratings.reduce(
    (counts, rating) => ({
      ...counts,
      [rating]: 0,
    }),
    {} as Record<TRating, number>
  );
}

function applyPatch<T extends object>(state: T, patch?: Partial<T> | void) {
  return patch ? { ...state, ...patch } : state;
}

export function useRhythmEngine<
  TSourceNote extends { id: string; time: number },
  TNote extends RhythmEngineActiveNote<TRating>,
  TRating extends string,
  TInput,
  TModeState extends object,
  TResult
>(
  config: RhythmEngineConfig<
    TSourceNote,
    TNote,
    TRating,
    TInput,
    TModeState,
    TResult
  >
): RhythmEngineReturn<TNote, TRating, TInput, TModeState, TResult> {
  const gameState = useGameState(1);
  const [state, setState] = useState<
    RhythmEngineState<TNote, TRating, TModeState>
  >(() => ({
    activeNotes: [],
    score: 0,
    combo: 0,
    maxCombo: 0,
    ratingCounts: createRatingCounts(config.ratings),
    modeState: config.createInitialModeState(),
  }));
  const [result, setResult] = useState<TResult | null>(null);
  const [progress, setProgress] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const noteIndexRef = useRef(0);

  const resetEngineState = useCallback(() => {
    setState({
      activeNotes: [],
      score: 0,
      combo: 0,
      maxCombo: 0,
      ratingCounts: createRatingCounts(config.ratings),
      modeState: config.createInitialModeState(),
    });
    setResult(null);
    setProgress(0);
    noteIndexRef.current = 0;
    startTimeRef.current = null;
  }, [config]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const finishGame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    gameState.finishGame();

    setState((prev) => {
      const totalHits = config.ratings.reduce(
        (total, rating) => total + prev.ratingCounts[rating],
        0
      );
      const weightedHits = config.ratings.reduce(
        (total, rating) =>
          total + prev.ratingCounts[rating] * (config.accuracyWeights[rating] ?? 0),
        0
      );
      const accuracy =
        totalHits > 0
          ? Math.round((weightedHits / (totalHits * 100)) * 100)
          : 0;

      setResult(
        config.buildResult({
          score: prev.score,
          maxCombo: prev.maxCombo,
          ratingCounts: prev.ratingCounts,
          accuracy,
        })
      );

      return prev;
    });
  }, [config, gameState]);

  const startGame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    resetEngineState();
    gameState.startGame();
  }, [gameState, resetEngineState]);

  const startPlaying = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    gameState.startPlaying();
    startTimeRef.current = performance.now();

    const gameLoop = () => {
      if (startTimeRef.current === null) {
        return;
      }

      const elapsed = performance.now() - startTimeRef.current;
      const totalDuration = config.beatMap.duration * 1000;

      setProgress(Math.min(elapsed / totalDuration, 1));

      const spawnedNotes: TNote[] = [];
      while (
        noteIndexRef.current < config.beatMap.notes.length &&
        config.beatMap.notes[noteIndexRef.current].time - config.approachTime <= elapsed
      ) {
        const note = config.beatMap.notes[noteIndexRef.current];
        spawnedNotes.push(config.createNote(note, performance.now()));
        noteIndexRef.current++;
      }

      setState((prev) => {
        const activeNotes =
          spawnedNotes.length > 0
            ? [...prev.activeNotes, ...spawnedNotes]
            : prev.activeNotes;

        let combo = prev.combo;
        let misses = prev.ratingCounts[config.missRating];
        let modeState = prev.modeState;

        const missedNotes = activeNotes.map((note) => {
          if (!note.hit && elapsed > note.time + (config.hitWindows.at(-1)?.window ?? 0)) {
            combo = 0;
            misses += 1;

            const baseMissNote = {
              ...note,
              hit: true,
              rating: config.missRating,
            } as TNote;
            const missPatch = config.onMiss?.({
              note: baseMissNote,
              elapsed,
              modeState,
            });

            modeState = applyPatch(modeState, missPatch?.modeStatePatch);

            return {
              ...baseMissNote,
              ...missPatch?.notePatch,
            };
          }

          return note;
        });

        const filteredNotes = missedNotes.filter(
          (note) => elapsed - note.time < config.noteCleanupMs || !note.hit
        );

        modeState = applyPatch(
          modeState,
          config.onTick?.({
            elapsed,
            modeState,
          })
        );

        return {
          ...prev,
          activeNotes: filteredNotes,
          combo,
          maxCombo: Math.max(prev.maxCombo, combo),
          ratingCounts: {
            ...prev.ratingCounts,
            [config.missRating]: misses,
          },
          modeState,
        };
      });

      if (elapsed >= totalDuration) {
        finishGame();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [config, finishGame, gameState]);

  const handleInput = useCallback(
    (input: TInput) => {
      if (startTimeRef.current === null) {
        return;
      }

      const elapsed = performance.now() - startTimeRef.current;

      setState((prev) => {
        const hittableNotes = prev.activeNotes.filter(
          (note) =>
            !note.hit &&
            config.matchNote(note, input) &&
            Math.abs(elapsed - note.time) < (config.hitWindows.at(-1)?.window ?? 0)
        );

        if (hittableNotes.length === 0) {
          return {
            ...prev,
            modeState: applyPatch(
              prev.modeState,
              config.onNoHit?.({
                input,
                elapsed,
                modeState: prev.modeState,
              })
            ),
          };
        }

        const closest = hittableNotes.reduce((a, b) =>
          Math.abs(elapsed - a.time) < Math.abs(elapsed - b.time) ? a : b
        );
        const timingOffset = Math.abs(elapsed - closest.time);
        const hitWindow = config.hitWindows.find(
          ({ window }) => timingOffset <= window
        );
        const rating = hitWindow?.rating ?? config.missRating;
        const baseScore = config.scoring[rating];
        const scoreGain = config.getScoreGain
          ? config.getScoreGain({
              input,
              note: closest,
              rating,
              baseScore,
            })
          : baseScore;
        const combo = rating === config.missRating ? 0 : prev.combo + 1;
        const comboMultiplier = config.getComboMultiplier(prev.combo);
        const finalScore = Math.round(scoreGain * comboMultiplier);
        const baseHitNote = {
          ...closest,
          hit: true,
          rating,
        } as TNote;
        const hitPatch: RhythmEnginePatch<TNote, TModeState> | void = config.onHit?.({
          input,
          note: baseHitNote,
          rating,
          elapsed,
          modeState: prev.modeState,
        });

        return {
          ...prev,
          activeNotes: prev.activeNotes.map((note) =>
            note.id === closest.id
              ? {
                  ...baseHitNote,
                  ...hitPatch?.notePatch,
                }
              : note
          ),
          score: prev.score + finalScore,
          combo,
          maxCombo: Math.max(prev.maxCombo, combo),
          ratingCounts: {
            ...prev.ratingCounts,
            [rating]: prev.ratingCounts[rating] + 1,
          },
          modeState: applyPatch(prev.modeState, hitPatch?.modeStatePatch),
        };
      });
    },
    [config]
  );

  const resetGame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    resetEngineState();
    gameState.resetGame();
  }, [gameState, resetEngineState]);

  const getCurrentTime = useCallback(() => {
    if (startTimeRef.current === null) {
      return 0;
    }

    return performance.now() - startTimeRef.current;
  }, []);

  const setModeState = useCallback(
    (updater: TModeState | ((prev: TModeState) => TModeState)) => {
      setState((prev) => ({
        ...prev,
        modeState:
          typeof updater === 'function'
            ? (updater as (value: TModeState) => TModeState)(prev.modeState)
            : updater,
      }));
    },
    []
  );

  return {
    gameState,
    activeNotes: state.activeNotes,
    score: state.score,
    combo: state.combo,
    maxCombo: state.maxCombo,
    ratingCounts: state.ratingCounts,
    modeState: state.modeState,
    result,
    progress,
    startGame,
    startPlaying,
    resetGame,
    handleInput,
    getCurrentTime,
    setModeState,
  };
}
