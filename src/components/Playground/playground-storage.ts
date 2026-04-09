import { STORAGE_KEYS } from './Playground.config';
import type { StoredScores } from './Playground.types';

export interface PlaygroundHubStats {
  trackedModes: number;
  bestReaction: string;
  bestTyping: string;
  topRhythm: string;
}

export function loadStoredScores(): Partial<StoredScores> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.highScores);
    return stored ? (JSON.parse(stored) as Partial<StoredScores>) : {};
  } catch {
    return {};
  }
}

export function getPlaygroundHubStats(scores: Partial<StoredScores>): PlaygroundHubStats {
  const trackedModes = [
    hasReactionScores(scores),
    hasTypingScores(scores),
    hasRhythmScores(scores),
    hasMinesweeperScores(scores),
    has2048Scores(scores),
    hasPacmanScores(scores),
    hasAimScores(scores),
    hasModeScoreMap(scores.taiko),
    hasModeScoreMap(scores.mania),
  ].filter(Boolean).length;

  const rhythmBest = Math.max(
    0,
    ...Object.values(scores.rhythm ?? {}).map((entry) => entry.score ?? 0),
    ...Object.values(scores.taiko ?? {}).map((entry) => entry.score ?? 0),
    ...Object.values(scores.mania ?? {}).map((entry) => entry.score ?? 0)
  );

  return {
    trackedModes,
    bestReaction: scores.reaction?.best ? `${scores.reaction.best}ms` : 'Unranked',
    bestTyping: scores.typing?.bestWPM ? `${scores.typing.bestWPM} WPM` : 'Unranked',
    topRhythm: rhythmBest > 0 ? rhythmBest.toLocaleString() : 'No clears yet',
  };
}

function hasReactionScores(scores: Partial<StoredScores>): boolean {
  return Boolean(scores.reaction?.best);
}

function hasTypingScores(scores: Partial<StoredScores>): boolean {
  return Boolean(scores.typing?.bestWPM);
}

function hasRhythmScores(scores: Partial<StoredScores>): boolean {
  return hasModeScoreMap(scores.rhythm);
}

function hasMinesweeperScores(scores: Partial<StoredScores>): boolean {
  return Object.values(scores.minesweeper ?? {}).some((entry) => entry.gamesPlayed > 0);
}

function has2048Scores(scores: Partial<StoredScores>): boolean {
  return Boolean(scores.game2048?.gamesPlayed);
}

function hasPacmanScores(scores: Partial<StoredScores>): boolean {
  return Boolean(scores.pacman?.gamesPlayed);
}

function hasAimScores(scores: Partial<StoredScores>): boolean {
  return Object.values(scores.aimTrainer ?? {}).some((entry) => entry.gamesPlayed > 0);
}

function hasModeScoreMap(
  scores: Record<string, { score: number }> | undefined
): boolean {
  return Object.values(scores ?? {}).some((entry) => entry.score > 0);
}
