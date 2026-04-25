import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRhythmHighScoreSaver } from './useRhythmHighScoreSaver';
import { STORAGE_KEYS } from '../../../Playground.config';

describe('useRhythmHighScoreSaver', () => {
  let storage = new Map<string, string>();

  beforeEach(() => {
    storage = new Map();

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      }),
      clear: vi.fn(() => {
        storage.clear();
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the best score fields and resets the game after saving', async () => {
    storage.set(
      STORAGE_KEYS.highScores,
      JSON.stringify({
        taiko: {
          'map-a': {
            score: 1200,
            maxCombo: 7,
            accuracy: 88,
          },
        },
      })
    );

    const resetGame = vi.fn();
    const { result } = renderHook(() =>
      useRhythmHighScoreSaver(
        'taiko',
        'map-a',
        {
          score: 1000,
          maxCombo: 12,
          accuracy: 91,
        },
        resetGame
      )
    );

    await waitFor(() => {
      expect(result.current.scores).toEqual({
        'map-a': {
          score: 1200,
          maxCombo: 7,
          accuracy: 88,
        },
      });
    });

    expect(result.current.currentBest).toBe(1200);
    expect(result.current.isNewBest).toBe(false);

    act(() => {
      result.current.handlePlayAgain();
    });

    expect(resetGame).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.get(STORAGE_KEYS.highScores) ?? '{}')).toEqual({
      taiko: {
        'map-a': {
          score: 1200,
          maxCombo: 12,
          accuracy: 91,
        },
      },
    });
  });

  it('does not flag or persist zero-score runs but still resets the game', async () => {
    const resetGame = vi.fn();
    const { result } = renderHook(() =>
      useRhythmHighScoreSaver(
        'mania',
        'map-b',
        {
          score: 0,
          maxCombo: 0,
          accuracy: 0,
        },
        resetGame
      )
    );

    await waitFor(() => {
      expect(result.current.scores).toBeNull();
    });

    act(() => {
      result.current.handlePlayAgain();
    });

    expect(resetGame).toHaveBeenCalledTimes(1);
    expect(storage.get(STORAGE_KEYS.highScores)).toBeUndefined();
    expect(result.current.isNewBest).toBe(false);
  });
});
