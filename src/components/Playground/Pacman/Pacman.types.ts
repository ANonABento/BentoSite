/**
 * Pacman - TypeScript interfaces
 */

export type Direction = 'up' | 'down' | 'left' | 'right' | null;

export type GameStatus = 'idle' | 'playing' | 'paused' | 'won' | 'lost';

export type GhostMode = 'chase' | 'scatter' | 'frightened' | 'eaten';

export type CellType = 'wall' | 'empty' | 'dot' | 'powerPellet' | 'ghostSpawn';

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  position: Position;
  direction: Direction;
  speed: number;
}

export interface Ghost extends Entity {
  id: 'blinky' | 'pinky' | 'inky' | 'clyde';
  color: string;
  mode: GhostMode;
  frightened: boolean;
  eaten: boolean;
  targetPosition: Position;
}

export interface GameState {
  status: GameStatus;
  pacman: Entity;
  ghosts: Ghost[];
  maze: CellType[][];
  score: number;
  lives: number;
  dotsRemaining: number;
  level: number;
  frightTimeRemaining: number;
}

export interface PacmanScores {
  highScore: number;
  gamesPlayed: number;
}
