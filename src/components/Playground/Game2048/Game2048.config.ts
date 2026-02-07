/**
 * 2048 - Configuration and constants
 */

// Grid configuration
export const GRID_SIZE = 4;
export const CELL_SIZE = 80;
export const CELL_SIZE_MOBILE = 64;
export const CELL_GAP = 12;
export const CELL_GAP_MOBILE = 8;

// Tile spawn probabilities
export const SPAWN_PROBABILITY_2 = 0.9;
export const SPAWN_PROBABILITY_4 = 0.1;

// Win condition
export const WIN_VALUE = 2048;

// Tile colors - background colors for each value
export const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: '#eee4da', text: '#776e65' },
  4: { bg: '#ede0c8', text: '#776e65' },
  8: { bg: '#f2b179', text: '#f9f6f2' },
  16: { bg: '#f59563', text: '#f9f6f2' },
  32: { bg: '#f67c5f', text: '#f9f6f2' },
  64: { bg: '#f65e3b', text: '#f9f6f2' },
  128: { bg: '#edcf72', text: '#f9f6f2' },
  256: { bg: '#edcc61', text: '#f9f6f2' },
  512: { bg: '#edc850', text: '#f9f6f2' },
  1024: { bg: '#edc53f', text: '#f9f6f2' },
  2048: { bg: '#edc22e', text: '#f9f6f2' },
  4096: { bg: '#3c3a32', text: '#f9f6f2' },
  8192: { bg: '#3c3a32', text: '#f9f6f2' },
};

// Animation durations
export const ANIMATION_DURATION = 150; // ms
export const MERGE_ANIMATION_DURATION = 200; // ms

// Keyboard mappings
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

// Touch gesture thresholds
export const SWIPE_THRESHOLD = 50; // minimum pixels for swipe detection
export const SWIPE_VELOCITY_THRESHOLD = 0.3; // minimum velocity for swipe
