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

function keepBestMetric(current: number | undefined, next: number) {
  return current !== undefined && current > next ? current : next;
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
    ? result.score > 0 && isNewHighScore(result.score, currentBest)
    : false;

  const handlePlayAgain = useCallback(() => {
    if (result && result.score > 0) {
      const currentMapScores = scores?.[mapId];
      const newScores = {
        ...(scores ?? {}),
        [mapId]: {
          score: keepBestMetric(currentMapScores?.score, result.score),
          maxCombo: keepBestMetric(currentMapScores?.maxCombo, result.maxCombo),
          accuracy: keepBestMetric(currentMapScores?.accuracy, result.accuracy),
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
