'use client';

import { useCallback } from 'react';
import { useHighScores } from '../../../Playground.hooks';
import { StoredScores } from '../../../Playground.types';
import { isNewHighScore } from '../../../Playground.utils';

type RhythmStorageKey = 'taiko' | 'mania';

interface RhythmGameResult {
  score: number;
  maxCombo: number;
  accuracy: number;
}

export function useRhythmHighScoreSaver<TGameId extends RhythmStorageKey>(
  gameId: TGameId,
  mapId: string,
  result: RhythmGameResult | null,
  resetGame: () => void
) {
  const { scores, saveScore } = useHighScores(gameId);
  const currentBest = scores?.[mapId]?.score;
  const isNewBest = result
    ? isNewHighScore(result.score, currentBest)
    : false;

  const handlePlayAgain = useCallback(() => {
    if (result && result.score > 0) {
      const currentMapScores = scores?.[mapId];
      const newScores = {
        ...(scores ?? {}),
        [mapId]: {
          score:
            currentMapScores?.score && currentMapScores.score > result.score
              ? currentMapScores.score
              : result.score,
          maxCombo:
            currentMapScores?.maxCombo && currentMapScores.maxCombo > result.maxCombo
              ? currentMapScores.maxCombo
              : result.maxCombo,
          accuracy:
            currentMapScores?.accuracy && currentMapScores.accuracy > result.accuracy
              ? currentMapScores.accuracy
              : result.accuracy,
        },
      } satisfies StoredScores[TGameId];

      saveScore(newScores);
    }

    resetGame();
  }, [mapId, resetGame, result, saveScore, scores]);

  return {
    scores,
    currentBest,
    isNewBest,
    handlePlayAgain,
  };
}
