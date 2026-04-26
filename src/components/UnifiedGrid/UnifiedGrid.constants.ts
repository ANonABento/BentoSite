/**
 * UnifiedGrid Constants
 *
 * Configuration values for the infinite grid system.
 */

import type { ThemeConfig, CardSize, GridTheme } from './UnifiedGrid.types';

// =============================================================================
// GRID LAYOUT
// =============================================================================

export const GRID = {
  /** Base cell size in pixels */
  CELL_SIZE: 180,
  /** Gap between cards in pixels */
  GAP: 12,
  /** Number of columns for initial layout */
  COLUMNS: 6,
  /** Buffer zone around viewport for spawning (pixels) */
  SPAWN_BUFFER: 100,
  /** Buffer zone for despawning (pixels beyond viewport) */
  DESPAWN_BUFFER: 200,
} as const;

// =============================================================================
// CARD SIZES
// =============================================================================

export const CARD_SIZES: Record<CardSize, { cols: number; rows: number }> = {
  '1x1': { cols: 1, rows: 1 },
  '2x1': { cols: 2, rows: 1 },
  '1x2': { cols: 1, rows: 2 },
  '2x2': { cols: 2, rows: 2 },
};

/** Calculate pixel dimensions for a card size */
export function getCardDimensions(size: CardSize): { width: number; height: number } {
  const { cols, rows } = CARD_SIZES[size];
  return {
    width: cols * GRID.CELL_SIZE + (cols - 1) * GRID.GAP,
    height: rows * GRID.CELL_SIZE + (rows - 1) * GRID.GAP,
  };
}

// =============================================================================
// QUEUE / SPAWNING
// =============================================================================

export const QUEUE = {
  /** Minimum delay between spawns (ms) */
  SPAWN_DELAY: 100,
  /** Maximum cards visible at once (performance) */
  MAX_VISIBLE: 30,
  /** Initial cards to spawn around center */
  INITIAL_SPAWN_COUNT: 12,
  /** Stagger delay for initial spawn animation (ms) */
  INITIAL_STAGGER: 50,
} as const;

// =============================================================================
// CAMERA / NAVIGATION
// =============================================================================

export const CAMERA = {
  /** Default camera position */
  DEFAULT: { x: 0, y: 0, zoom: 1 },
  /** Minimum zoom level */
  MIN_ZOOM: 0.4,
  /** Maximum zoom level */
  MAX_ZOOM: 2.0,
  /** Zoom sensitivity for scroll wheel */
  ZOOM_SENSITIVITY: 0.001,
  /** Pan speed for WASD keys (pixels per frame) */
  PAN_SPEED: 15,
  /** Momentum friction (0-1, lower = more friction) */
  MOMENTUM_FRICTION: 0.92,
  /** Minimum velocity before stopping momentum */
  MIN_VELOCITY: 0.5,
  /** Spring stiffness for camera animations */
  SPRING_STIFFNESS: 200,
  /** Spring damping for camera animations */
  SPRING_DAMPING: 30,
} as const;

// =============================================================================
// INTERACTION
// =============================================================================

export const INTERACTION = {
  /** Minimum drag distance to differentiate from click (px) */
  DRAG_THRESHOLD: 5,
  /** Maximum duration for a click (ms) */
  CLICK_MAX_DURATION: 200,
  /** Touch target minimum size (px) */
  TOUCH_TARGET_MIN: 44,
} as const;

// =============================================================================
// SEARCH CARD
// =============================================================================

const SEARCH_CARD_DIMENSIONS = getCardDimensions('2x1');

export const SEARCH_CARD = {
  /** Width when expanded */
  EXPANDED_WIDTH: SEARCH_CARD_DIMENSIONS.width,
  /** Height when expanded */
  EXPANDED_HEIGHT: SEARCH_CARD_DIMENSIONS.height,
  /** Height when collapsed to bar */
  COLLAPSED_HEIGHT: 48,
  /** Minimum width when compressed against a side edge */
  SQUASHED_SIDE_WIDTH: 64,
  /** Off-screen distance needed to reach the fully squashed state */
  COMPRESSION_DISTANCE: 180,
  /** Padding from viewport edge when collapsed */
  EDGE_PADDING: 16,
} as const;

// =============================================================================
// ANIMATION
// =============================================================================

export const ANIMATION = {
  /** Card entrance animation duration (ms) */
  CARD_ENTER: 300,
  /** Card exit animation duration (ms) */
  CARD_EXIT: 200,
  /** Stagger delay between card animations (ms) */
  STAGGER: 30,
  /** Spring config for card movements - smoother feel */
  SPRING: {
    stiffness: 180,
    damping: 25,
  },
} as const;

// =============================================================================
// THEMES
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
    rotationRange: 3, // -3deg to +3deg
  },
  accent: {
    primary: '#ff00ff',   // Magenta
    secondary: '#00ffff', // Cyan
    tertiary: '#ffff00',  // Yellow
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
    rotationRange: 0, // No rotation - clean lines
  },
  accent: {
    primary: '#8b5cf6',   // Violet
    secondary: '#6366f1', // Indigo
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
// MOBILE
// =============================================================================

export const MOBILE = {
  /** Breakpoint for mobile detection */
  BREAKPOINT: 768,
  /** Card width on mobile (percentage of viewport) */
  CARD_WIDTH_PERCENT: 0.9,
  /** Maximum card width on mobile */
  CARD_MAX_WIDTH: 400,
  /** Gap between cards in scroll view */
  SCROLL_GAP: 16,
  /** Padding at top/bottom of scroll view */
  SCROLL_PADDING: 24,
} as const;

// =============================================================================
// PERFORMANCE
// =============================================================================

export const PERFORMANCE = {
  /** Throttle interval for scroll/pan handlers (ms) */
  THROTTLE_INTERVAL: 16, // ~60fps
  /** Maximum cards to render in low-performance mode */
  LOW_PERF_MAX_CARDS: 15,
  /** FPS threshold to trigger low-performance mode */
  LOW_FPS_THRESHOLD: 30,
} as const;

// =============================================================================
// KEYBOARD
// =============================================================================

export const KEYBOARD = {
  /** Keys for panning (WASD only - arrows reserved for card nav) */
  PAN_UP: ['w', 'W'] as string[],
  PAN_DOWN: ['s', 'S'] as string[],
  PAN_LEFT: ['a', 'A'] as string[],
  PAN_RIGHT: ['d', 'D'] as string[],
  /** Arrow keys for card navigation */
  CARD_UP: ['ArrowUp'] as string[],
  CARD_DOWN: ['ArrowDown'] as string[],
  CARD_LEFT: ['ArrowLeft'] as string[],
  CARD_RIGHT: ['ArrowRight'] as string[],
  /** Keys to select focused card */
  SELECT: ['Enter', ' '] as string[],
  /** Key to clear focus / blur input */
  BLUR: ['Escape'] as string[],
  /** Key to reset view */
  RESET: ['r', 'R'] as string[],
  /** Key to go back */
  BACK: ['Backspace'] as string[],
  /** Key to focus search */
  SEARCH: ['/', 'f', 'F'] as string[],
  /** Key to cycle through cards */
  CYCLE: ['Tab'] as string[],
} as const;
