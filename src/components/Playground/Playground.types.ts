/**
 * Playground - Shared TypeScript interfaces
 */

// Game state machine
export type GameStatus = 'idle' | 'countdown' | 'playing' | 'finished';

export interface GameState {
  status: GameStatus;
  round: number;
  totalRounds: number;
}

// High score storage
export interface HighScore {
  score: number;
  date: string;
  details?: Record<string, number | string>;
}

export interface StoredScores {
  reaction: {
    best: number; // Best average reaction time in ms
    history: number[]; // Recent averages
  };
  typing: {
    bestWPM: number;
    bestAccuracy: number;
    history: TypingResult[];
  };
  rhythm: {
    [songId: string]: {
      score: number;
      maxCombo: number;
      accuracy: number;
    };
  };
  minesweeper: {
    [difficulty: string]: {
      bestTime: number;
      gamesPlayed: number;
      gamesWon: number;
    };
  };
  game2048: {
    bestScore: number;
    highestTile: number;
    gamesPlayed: number;
  };
  pacman: {
    highScore: number;
    gamesPlayed: number;
  };
  aimTrainer: {
    [mode: string]: {
      bestScore: number;
      bestAccuracy: number;
      gamesPlayed: number;
    };
  };
  taiko: {
    [songId: string]: {
      score: number;
      maxCombo: number;
      accuracy: number;
    };
  };
  mania: {
    [songId: string]: {
      score: number;
      maxCombo: number;
      accuracy: number;
    };
  };
}

// Reaction game
export interface ReactionRound {
  reactionTime: number; // ms, -1 for too early
  timestamp: number;
}

export interface ReactionResult {
  rounds: ReactionRound[];
  average: number;
  best: number;
  worst: number;
}

// Typing game
export type TypingDifficulty = 'easy' | 'medium' | 'hard';
export type TypingDuration = 30 | 60 | 120;

export interface TypingResult {
  wpm: number;
  accuracy: number;
  correctChars: number;
  totalChars: number;
  duration: TypingDuration;
  difficulty: TypingDifficulty;
  date: string;
}

export interface TypingState {
  text: string;
  typedText: string;
  currentIndex: number;
  errors: Set<number>;
  startTime: number | null;
  endTime: number | null;
}

// Rhythm game
export type HitRating = 'perfect' | 'good' | 'miss';

export interface BeatNote {
  id: string;
  time: number; // ms from song start
  x: number; // 0-1 position
  y: number; // 0-1 position
}

export interface BeatMap {
  id: string;
  name: string;
  artist: string;
  audioUrl: string;
  bpm: number;
  duration: number; // seconds
  difficulty: 'easy' | 'medium' | 'hard';
  notes: BeatNote[];
}

export interface RhythmHit {
  noteId: string;
  rating: HitRating;
  timing: number; // ms offset from perfect
}

export interface RhythmResult {
  songId: string;
  score: number;
  maxCombo: number;
  perfects: number;
  goods: number;
  misses: number;
  accuracy: number;
}

// Game card for hub
export interface GameInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: 'primary' | 'orange';
}
