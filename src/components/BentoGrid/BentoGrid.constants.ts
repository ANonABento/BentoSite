/**
 * Consolidated BentoGrid constants.
 */

import type {
  CardSize,
  GridTheme,
  PhysicsConfig,
  ThemeConfig,
} from './BentoGrid.types';

// =============================================================================
// Grid Layout
// =============================================================================

export const GRID = {
  CELL_SIZE: 180,
  GAP: 12,
  COLUMNS: 6,
  SPAWN_BUFFER: 100,
  DESPAWN_BUFFER: 200,
} as const;

export const PHYSICS_GRID = {
  cellSize: GRID.CELL_SIZE,
  columns: GRID.COLUMNS,
  gap: GRID.GAP,
} as const;

export const CARD_SIZES: Record<CardSize, { cols: number; rows: number }> = {
  '1x1': { cols: 1, rows: 1 },
  '2x1': { cols: 2, rows: 1 },
  '1x2': { cols: 1, rows: 2 },
  '2x2': { cols: 2, rows: 2 },
};

export function getCardDimensions(size: CardSize): { width: number; height: number } {
  const { cols, rows } = CARD_SIZES[size];

  return {
    width: cols * GRID.CELL_SIZE + (cols - 1) * GRID.GAP,
    height: rows * GRID.CELL_SIZE + (rows - 1) * GRID.GAP,
  };
}

// =============================================================================
// Physics Engine
// =============================================================================

export const PHYSICS: PhysicsConfig = {
  friction: 0.05,
  frictionAir: 0.01,
  restitution: 0.7,
  density: 0.001,
  sleepThreshold: 120,
  settlingStrength: 0.002,
  damping: 0.985,
  maxSettlingForce: 0.08,
  entranceBurstStrength: 8,
};

export const PHYSICS_MOBILE: PhysicsConfig = {
  friction: 0.08,
  frictionAir: 0.02,
  restitution: 0.6,
  density: 0.001,
  sleepThreshold: 80,
  settlingStrength: 0.003,
  damping: 0.975,
  maxSettlingForce: 0.06,
  entranceBurstStrength: 5,
};

// =============================================================================
// Search Card
// =============================================================================

const SEARCH_CARD_DIMENSIONS = getCardDimensions('2x1');

export const SEARCH_CARD = {
  EXPANDED_WIDTH: SEARCH_CARD_DIMENSIONS.width,
  EXPANDED_HEIGHT: SEARCH_CARD_DIMENSIONS.height,
  COLLAPSED_HEIGHT: 56,
  SQUASHED_SIDE_WIDTH: 80,
  COMPRESSION_DISTANCE: 180,
  EDGE_PADDING: 16,
  EXCLUSION_PADDING: 24,
  PHYSICS_ID: '__search__',
} as const;

// =============================================================================
// Queue / Spawning
// =============================================================================

export const QUEUE = {
  SPAWN_DELAY: 100,
  MAX_VISIBLE: 30,
  INITIAL_SPAWN_COUNT: 12,
  INITIAL_STAGGER: 50,
} as const;

// =============================================================================
// Camera / Navigation
// =============================================================================

export const CAMERA = {
  DEFAULT: { x: 0, y: 0, zoom: 1 },
  MIN_ZOOM: 0.4,
  MAX_ZOOM: 2.0,
  ZOOM_SENSITIVITY: 0.001,
  PAN_SPEED: 15,
  MOMENTUM_FRICTION: 0.92,
  MIN_VELOCITY: 0.5,
  SPRING_STIFFNESS: 200,
  SPRING_DAMPING: 30,
} as const;

// =============================================================================
// Interaction / Animation
// =============================================================================

export const INTERACTION = {
  DRAG_THRESHOLD: 5,
  CLICK_MAX_DURATION: 200,
  TOUCH_TARGET_MIN: 44,
} as const;

export const ANIMATION = {
  CARD_ENTER: 300,
  CARD_EXIT: 200,
  STAGGER: 30,
  SPRING: {
    stiffness: 180,
    damping: 25,
  },
} as const;

// =============================================================================
// Themes
// =============================================================================

export const THEME_PLAYFUL: ThemeConfig = {
  name: 'playful',
  background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0d0415 100%)',
  card: {
    background: 'linear-gradient(135deg, rgba(255, 0, 255, 0.1) 0%, rgba(0, 255, 255, 0.05) 100%)',
    border: '2px solid rgba(255, 0, 255, 0.25)',
    borderRadius: 20,
    shadow: '0 0 20px rgba(255, 0, 255, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3)',
    hoverShadow: '0 0 40px rgba(255, 0, 255, 0.3), 0 12px 48px rgba(0, 0, 0, 0.4)',
    rotationRange: 3,
  },
  accent: {
    primary: '#ff00ff',
    secondary: '#00ffff',
    tertiary: '#ffff00',
  },
  searchCard: {
    background: 'rgba(26, 10, 46, 0.95)',
    border: '2px solid rgba(255, 0, 255, 0.3)',
  },
};

export const THEME_PREMIUM: ThemeConfig = {
  name: 'premium',
  background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
  card: {
    background: 'rgba(20, 20, 20, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    shadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
    hoverShadow: '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.3)',
    rotationRange: 0,
  },
  accent: {
    primary: '#8b5cf6',
    secondary: '#6366f1',
  },
  searchCard: {
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
};

export const THEMES = {
  playful: THEME_PLAYFUL,
  premium: THEME_PREMIUM,
} satisfies Record<GridTheme, ThemeConfig>;

// =============================================================================
// Mobile / Keyboard
// =============================================================================

export const MOBILE = {
  BREAKPOINT: 768,
  CARD_WIDTH_PERCENT: 0.9,
  CARD_MAX_WIDTH: 400,
  SCROLL_GAP: 16,
  SCROLL_PADDING: 24,
} as const;

export const KEYBOARD = {
  PAN_UP: ['w', 'W'] as string[],
  PAN_DOWN: ['s', 'S'] as string[],
  PAN_LEFT: ['a', 'A'] as string[],
  PAN_RIGHT: ['d', 'D'] as string[],
  CARD_UP: ['ArrowUp'] as string[],
  CARD_DOWN: ['ArrowDown'] as string[],
  CARD_LEFT: ['ArrowLeft'] as string[],
  CARD_RIGHT: ['ArrowRight'] as string[],
  SELECT: ['Enter', ' '] as string[],
  BLUR: ['Escape'] as string[],
  RESET: ['r', 'R'] as string[],
  BACK: ['Backspace'] as string[],
  SEARCH: ['/', 'f', 'F'] as string[],
  CYCLE: ['Tab'] as string[],
} as const;
