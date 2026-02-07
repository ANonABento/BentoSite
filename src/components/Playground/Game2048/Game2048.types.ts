/**
 * 2048 - TypeScript interfaces
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export interface TileData {
  id: string;
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  isMerged: boolean;
}

export interface GameState {
  grid: (TileData | null)[][];
  tiles: TileData[];
  score: number;
  bestScore: number;
  status: GameStatus;
  hasWon: boolean; // Player reached 2048
  continueAfterWin: boolean; // Player chose to continue after winning
}

export interface MoveResult {
  grid: (TileData | null)[][];
  tiles: TileData[];
  scoreGained: number;
  moved: boolean;
  won: boolean;
}

export interface Game2048Scores {
  bestScore: number;
  highestTile: number;
  gamesPlayed: number;
}
