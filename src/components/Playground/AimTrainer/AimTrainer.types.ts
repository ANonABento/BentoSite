/**
 * 3D Aim Trainer - TypeScript interfaces
 */

export type GameMode = 'gridShot' | 'spiderShot' | 'tracking' | 'flick';

export type GameStatus = 'idle' | 'playing' | 'finished';

export interface Target {
  id: string;
  position: [number, number, number];
  size: number;
  active: boolean;
  spawnTime: number;
}

export interface GameSettings {
  mode: GameMode;
  duration: number; // seconds
  targetSize: number; // multiplier
  sensitivity: number;
}

export interface GameState {
  status: GameStatus;
  targets: Target[];
  hits: number;
  misses: number;
  totalShots: number;
  score: number;
  startTime: number | null;
  elapsedTime: number;
}

export interface AimTrainerScores {
  [mode: string]: {
    bestScore: number;
    bestAccuracy: number;
    gamesPlayed: number;
  };
}

export interface ModeInfo {
  id: GameMode;
  name: string;
  description: string;
}
