/**
 * Minesweeper - Configuration and constants
 */

import { Difficulty, DifficultyConfig } from './Minesweeper.types';

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    name: 'Beginner',
    rows: 9,
    cols: 9,
    mines: 10,
  },
  intermediate: {
    name: 'Intermediate',
    rows: 16,
    cols: 16,
    mines: 40,
  },
  expert: {
    name: 'Expert',
    rows: 16,
    cols: 30,
    mines: 99,
  },
};

// Cell size in pixels
export const CELL_SIZE = 32;
export const CELL_SIZE_MOBILE = 28;

// Number colors (1-8)
export const NUMBER_COLORS: Record<number, string> = {
  1: '#3b82f6', // blue
  2: '#22c55e', // green
  3: '#ef4444', // red
  4: '#e07b3c', // primary
  5: '#a855f7', // pink-ish
  6: '#06b6d4', // cyan
  7: '#1f2937', // dark
  8: '#6b7280', // gray
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  newGame: 'n',
  flag: 'f',
} as const;
