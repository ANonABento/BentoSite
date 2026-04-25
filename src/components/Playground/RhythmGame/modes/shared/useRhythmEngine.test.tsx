import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRhythmEngine } from './useRhythmEngine';
import type { RhythmEngineActiveNote } from './types';

type TestRating = 'perfect' | 'good' | 'miss';

interface TestSourceNote {
  id: string;
  time: number;
  lane: number;
}

interface TestNote extends TestSourceNote, RhythmEngineActiveNote<TestRating> {}

interface TestModeState {
  noHitInputs: number[];
  missedNoteIds: string[];
  tickCount: number;
}

interface TestResult {
  score: number;
  maxCombo: number;
  accuracy: number;
  ratingCounts: Record<TestRating, number>;
}

describe('useRhythmEngine', () => {
  let now = 0;
  let rafId = 0;
  let rafQueue = new Map<number, FrameRequestCallback>();
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
  let originalCancelAnimationFrame: typeof window.cancelAnimationFrame;

  const runNextFrame = (time: number) => {
    const nextFrame = rafQueue.entries().next().value as
      | [number, FrameRequestCallback]
      | undefined;

    expect(nextFrame).toBeDefined();

    const [id, callback] = nextFrame!;
    rafQueue.delete(id);
    now = time;

    act(() => {
      callback(time);
    });
  };

  beforeEach(() => {
    now = 0;
    rafId = 0;
    rafQueue = new Map();

    vi.spyOn(performance, 'now').mockImplementation(() => now);

    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;

    window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      rafId += 1;
      rafQueue.set(rafId, callback);
      return rafId;
    });

    window.cancelAnimationFrame = vi.fn((id: number) => {
      rafQueue.delete(id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
  });

  it('keeps scoring, misses, cleanup, and result calculation consistent through the shared loop', () => {
    const { result } = renderHook(() =>
      useRhythmEngine<
        TestSourceNote,
        TestNote,
        TestRating,
        number,
        TestModeState,
        TestResult
      >({
        beatMap: {
          duration: 2,
          notes: [
            { id: 'first', time: 500, lane: 0 },
            { id: 'second', time: 900, lane: 1 },
          ],
        },
        approachTime: 250,
        noteCleanupMs: 200,
        ratings: ['perfect', 'good', 'miss'],
        missRating: 'miss',
        hitWindows: [
          { rating: 'perfect', window: 20 },
          { rating: 'good', window: 50 },
          { rating: 'miss', window: 100 },
        ],
        scoring: {
          perfect: 300,
          good: 150,
          miss: 0,
        },
        accuracyWeights: {
          perfect: 100,
          good: 50,
          miss: 0,
        },
        createNote: (note, spawnTime) => ({
          ...note,
          spawnTime,
          hit: false,
        }),
        createInitialModeState: () => ({
          noHitInputs: [],
          missedNoteIds: [],
          tickCount: 0,
        }),
        getComboMultiplier: () => 1,
        matchNote: (note, input) => note.lane === input,
        onNoHit: ({ input, modeState }) => ({
          noHitInputs: [...modeState.noHitInputs, input],
        }),
        onMiss: ({ note, modeState }) => ({
          modeStatePatch: {
            missedNoteIds: [...modeState.missedNoteIds, note.id],
          },
        }),
        onTick: ({ modeState }) => ({
          tickCount: modeState.tickCount + 1,
        }),
        buildResult: ({ score, maxCombo, accuracy, ratingCounts }) => ({
          score,
          maxCombo,
          accuracy,
          ratingCounts,
        }),
      })
    );

    act(() => {
      result.current.startGame();
    });

    expect(result.current.gameState.status).toBe('countdown');

    act(() => {
      result.current.startPlaying();
    });

    expect(result.current.gameState.status).toBe('playing');

    runNextFrame(260);

    expect(result.current.activeNotes).toHaveLength(1);
    expect(result.current.activeNotes[0]).toMatchObject({
      id: 'first',
      hit: false,
    });
    expect(result.current.modeState.tickCount).toBe(1);

    now = 500;
    act(() => {
      result.current.handleInput(0);
    });

    expect(result.current.score).toBe(300);
    expect(result.current.combo).toBe(1);
    expect(result.current.maxCombo).toBe(1);
    expect(result.current.ratingCounts).toEqual({
      perfect: 1,
      good: 0,
      miss: 0,
    });
    expect(result.current.activeNotes[0]).toMatchObject({
      id: 'first',
      hit: true,
      rating: 'perfect',
    });

    now = 700;
    act(() => {
      result.current.handleInput(9);
    });

    expect(result.current.modeState.noHitInputs).toEqual([9]);

    runNextFrame(1050);

    expect(result.current.combo).toBe(0);
    expect(result.current.ratingCounts).toEqual({
      perfect: 1,
      good: 0,
      miss: 1,
    });
    expect(result.current.modeState.missedNoteIds).toEqual(['second']);
    expect(result.current.activeNotes).toHaveLength(1);
    expect(result.current.activeNotes[0]).toMatchObject({
      id: 'second',
      hit: true,
      rating: 'miss',
    });

    runNextFrame(1201);
    expect(result.current.activeNotes).toHaveLength(0);

    runNextFrame(2000);

    expect(result.current.gameState.status).toBe('finished');
    expect(result.current.result).toEqual({
      score: 300,
      maxCombo: 1,
      accuracy: 50,
      ratingCounts: {
        perfect: 1,
        good: 0,
        miss: 1,
      },
    });
    expect(rafQueue.size).toBe(0);
  });
});
