/**
 * Pacman - Configuration
 */

import { CellType } from './Pacman.types';

// Grid configuration
export const CELL_SIZE = 20;
export const CELL_SIZE_MOBILE = 16;

// Game settings
export const INITIAL_LIVES = 3;
export const DOT_SCORE = 10;
export const POWER_PELLET_SCORE = 50;
export const GHOST_SCORE_BASE = 200;
export const FRIGHTENED_DURATION = 8000; // ms
export const GHOST_SPEED = 0.08;
export const PACMAN_SPEED = 0.1;

// Colors
export const COLORS = {
  wall: '#1e3a8a',
  empty: '#000',
  dot: '#e07b3c',
  powerPellet: '#e07b3c',
  pacman: '#e07b3c',
  blinky: '#ef4444', // red
  pinky: '#f472b6', // pink
  inky: '#06b6d4',  // cyan
  clyde: '#f97316', // orange
  frightened: '#3b82f6',
  eyes: '#fff',
};

// Simplified maze layout (W=wall, .=dot, o=power pellet, _=empty, G=ghost spawn)
const MAZE_TEMPLATE = `
WWWWWWWWWWWWWWWWWWWWWWWWWWWWW
W............WW............W
W.WWWW.WWWWW.WW.WWWWW.WWWW.W
WoWWWW.WWWWW.WW.WWWWW.WWWWoW
W.WWWW.WWWWW.WW.WWWWW.WWWW.W
W...........................W
W.WWWW.WW.WWWWWWWW.WW.WWWW.W
W.WWWW.WW.WWWWWWWW.WW.WWWW.W
W......WW....WW....WW......W
WWWWWW.WWWWW_WW_WWWWW.WWWWWW
_____W.WWWWW_WW_WWWWW.W_____
_____W.WW__________WW.W_____
_____W.WW_WWW__WWW_WW.W_____
WWWWWW.WW_W_GGGG_W_WW.WWWWWW
______.__._GGGGGG_.__._____
WWWWWW.WW_W______W_WW.WWWWWW
_____W.WW_WWWWWWWW_WW.W_____
_____W.WW__________WW.W_____
_____W.WW_WWWWWWWW_WW.W_____
WWWWWW.WW_WWWWWWWW_WW.WWWWWW
W............WW............W
W.WWWW.WWWWW.WW.WWWWW.WWWW.W
W.WWWW.WWWWW.WW.WWWWW.WWWW.W
Wo..WW.......__.......WW..oW
WWW.WW.WW.WWWWWWWW.WW.WW.WWW
WWW.WW.WW.WWWWWWWW.WW.WW.WWW
W......WW....WW....WW......W
W.WWWWWWWWWW.WW.WWWWWWWWWW.W
W.WWWWWWWWWW.WW.WWWWWWWWWW.W
W...........................W
WWWWWWWWWWWWWWWWWWWWWWWWWWWWW
`.trim();

export function parseMaze(): { maze: CellType[][], ghostSpawn: { x: number, y: number }[], pacmanSpawn: { x: number, y: number } } {
  const lines = MAZE_TEMPLATE.split('\n');
  const maze: CellType[][] = [];
  const ghostSpawn: { x: number, y: number }[] = [];
  let pacmanSpawn = { x: 14, y: 23 }; // default

  for (let y = 0; y < lines.length; y++) {
    const row: CellType[] = [];
    for (let x = 0; x < lines[y].length; x++) {
      const char = lines[y][x];
      switch (char) {
        case 'W':
          row.push('wall');
          break;
        case '.':
          row.push('dot');
          break;
        case 'o':
          row.push('powerPellet');
          break;
        case 'G':
          row.push('ghostSpawn');
          ghostSpawn.push({ x, y });
          break;
        case '_':
        default:
          row.push('empty');
          break;
      }
    }
    maze.push(row);
  }

  // Pacman spawns at bottom center
  pacmanSpawn = { x: 14, y: 23 };

  return { maze, ghostSpawn, pacmanSpawn };
}

export const MAZE_WIDTH = 29;
export const MAZE_HEIGHT = 31;

// Key mappings
export const KEY_MAPPINGS: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
};
