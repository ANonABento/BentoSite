'use client';

import { useCallback, useEffect } from 'react';
import {
  ManiaBeatMap,
  ManiaNote,
  TIMING_WINDOWS,
  SCORING,
  MANIA_DIMENSIONS,
  KEY_BINDINGS,
} from './ManiaGame.config';
import { RhythmEngineActiveNote, useRhythmEngine } from './shared';

type ManiaRating = 'perfect' | 'great' | 'good' | 'miss';

interface ActiveManiaNote extends ManiaNote, RhythmEngineActiveNote<ManiaRating> {
  holdActive?: boolean;
  holdProgress?: number;
}

interface ManiaModeState {
  pressedKeys: Set<number>;
  keyFlash: number[];
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
  const engine = useRhythmEngine<
    ManiaNote,
    ActiveManiaNote,
    ManiaRating,
    number,
    ManiaModeState,
    ManiaResult
  >({
    beatMap,
    approachTime: MANIA_DIMENSIONS.approachTime,
    noteCleanupMs: 500,
    ratings: ['perfect', 'great', 'good', 'miss'],
    missRating: 'miss',
    hitWindows: [
      { rating: 'perfect', window: TIMING_WINDOWS.perfect },
      { rating: 'great', window: TIMING_WINDOWS.great },
      { rating: 'good', window: TIMING_WINDOWS.good },
      { rating: 'miss', window: TIMING_WINDOWS.miss },
    ],
    scoring: SCORING,
    accuracyWeights: {
      perfect: 100,
      great: 80,
      good: 50,
      miss: 0,
    },
    createNote: (note, spawnTime) => ({
      ...note,
      spawnTime,
      hit: false,
    }),
    createInitialModeState: () => ({
      pressedKeys: new Set(),
      keyFlash: [],
    }),
    getComboMultiplier: (combo) => Math.min(1 + combo * 0.05, 2),
    matchNote: (note, input) => note.lane === input,
    onHit: ({ input, note, modeState }) => ({
      notePatch: {
        holdActive: note.holdDuration ? true : undefined,
      },
      modeStatePatch: {
        pressedKeys: new Set([...modeState.pressedKeys, input]),
        keyFlash: [...modeState.keyFlash, input],
      },
    }),
    onNoHit: ({ input, modeState }) => ({
      pressedKeys: new Set([...modeState.pressedKeys, input]),
      keyFlash: [...modeState.keyFlash, input],
    }),
    onTick: () => ({
      keyFlash: [],
    }),
    buildResult: ({ score, maxCombo, ratingCounts, accuracy }) => ({
      score,
      maxCombo,
      perfects: ratingCounts.perfect,
      greats: ratingCounts.great,
      goods: ratingCounts.good,
      misses: ratingCounts.miss,
      accuracy,
    }),
  });

  const handleKeyPress = useCallback(
    (lane: number) => {
      engine.handleInput(lane);
    },
    [engine]
  );

  const handleKeyRelease = useCallback(
    (lane: number) => {
      engine.setModeState((prev) => ({
        ...prev,
        pressedKeys: new Set([...prev.pressedKeys].filter((key) => key !== lane)),
      }));
    },
    [engine]
  );

  useEffect(() => {
    if (engine.gameState.status !== 'playing') {
      return;
    }

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
  }, [beatMap.keyCount, engine.gameState.status, handleKeyPress, handleKeyRelease]);

  return {
    ...engine.gameState,
    activeNotes: engine.activeNotes,
    score: engine.score,
    combo: engine.combo,
    maxCombo: engine.maxCombo,
    perfects: engine.ratingCounts.perfect,
    greats: engine.ratingCounts.great,
    goods: engine.ratingCounts.good,
    misses: engine.ratingCounts.miss,
    pressedKeys: engine.modeState.pressedKeys,
    keyFlash: engine.modeState.keyFlash,
    result: engine.result,
    progress: engine.progress,
    startGame: engine.startGame,
    startPlaying: engine.startPlaying,
    handleKeyPress,
    handleKeyRelease,
    resetGame: engine.resetGame,
    getCurrentTime: engine.getCurrentTime,
  };
}
