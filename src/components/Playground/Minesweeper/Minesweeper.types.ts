/**
 * Minesweeper - TypeScript interfaces
 */

export type Difficulty = 'beginner' | 'intermediate' | 'expert';

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export interface DifficultyConfig {
  name: string;
  rows: number;
  cols: number;
  mines: number;
}

export interface GameState {
  grid: Cell[][];
  status: GameStatus;
  difficulty: Difficulty;
  minesRemaining: number;
  startTime: number | null;
  elapsedTime: number;
  isFirstClick: boolean;
}

export interface MinesweeperResult {
  difficulty: Difficulty;
  time: number;
  won: boolean;
  date: string;
}

export interface MinesweeperScores {
  [key: string]: {
    bestTime: number;
    gamesPlayed: number;
    gamesWon: number;
  };
}
