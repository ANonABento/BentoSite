/**
 * BentoGrid Constants
 *
 * Consolidates InfiniteGrid's canvas/physics configuration with UnifiedGrid's
 * pool, search compression, theme, mobile, and keyboard constants.
 */

import type {
  CardSize,
  GridLayoutConfig,
  GridTheme,
  PhysicsConfig,
  ThemeConfig,
} from './BentoGrid.types';

// =============================================================================
// Grid Layout
// =============================================================================

export const GRID: GridLayoutConfig & {
  /** Buffer zone around viewport for spawning (pixels). */
  spawnBuffer: number;
  /** Buffer zone for despawning (pixels beyond viewport). */
  despawnBuffer: number;
  /** @deprecated Use cellSize. */
  CELL_SIZE: number;
  /** @deprecated Use gap. */
  GAP: number;
  /** @deprecated Use spawnBuffer. */
  SPAWN_BUFFER: number;
  /** @deprecated Use despawnBuffer. */
  DESPAWN_BUFFER: number;
} = {
  cellSize: 180,
  gap: 12,
  spawnBuffer: 100,
  despawnBuffer: 200,
  CELL_SIZE: 180,
  GAP: 12,
  SPAWN_BUFFER: 100,
  DESPAWN_BUFFER: 200,
};

export const CARD_SIZES: Record<CardSize, { cols: number; rows: number }> = {
  '1x1': { cols: 1, rows: 1 },
  '2x1': { cols: 2, rows: 1 },
  '1x2': { cols: 1, rows: 2 },
  '2x2': { cols: 2, rows: 2 },
};

/** Calculate pixel dimensions for a card size. */
export function getCardDimensions(size: CardSize): { width: number; height: number } {
  const { cols, rows } = CARD_SIZES[size];

  return {
    width: cols * GRID.cellSize + (cols - 1) * GRID.gap,
    height: rows * GRID.cellSize + (rows - 1) * GRID.gap,
  };
}

// =============================================================================
// Card Pool / Spawning
// =============================================================================

export const CARD_POOL = {
  /** Minimum delay between spawns (ms). */
  spawnDelay: 100,
  /** Maximum cards visible at once. */
  maxVisible: 30,
  /** Initial cards to spawn around center. */
  initialSpawnCount: 12,
  /** Stagger delay for initial spawn animation (ms). */
  initialStagger: 50,
  /** Queue policy for cards waiting to respawn. */
  policy: 'FIFO',
  /** @deprecated Use spawnDelay. */
  SPAWN_DELAY: 100,
  /** @deprecated Use maxVisible. */
  MAX_VISIBLE: 30,
  /** @deprecated Use initialSpawnCount. */
  INITIAL_SPAWN_COUNT: 12,
  /** @deprecated Use initialStagger. */
  INITIAL_STAGGER: 50,
  /** @deprecated Use policy. */
  POLICY: 'FIFO',
} as const;

/** @deprecated Use CARD_POOL. Kept during the refactor bridge. */
export const QUEUE = CARD_POOL;

// =============================================================================
// Camera & Canvas
// =============================================================================

export const CAMERA = {
  DEFAULT: { x: 0, y: 0, zoom: 1 },
  MIN_ZOOM: 0.3,
  MAX_ZOOM: 2.5,
  ZOOM_SENSITIVITY: 0.001,
  PAN_SPEED: 15,
  MOMENTUM_FRICTION: 0.92,
  MIN_VELOCITY: 0.5,
  SPRING_STIFFNESS: 200,
  SPRING_DAMPING: 30,
  minZoom: 0.3,
  maxZoom: 2.5,
  defaultZoom: 1,
  keyboardPanSpeed: 30,
  wheelPanMultiplier: 1.5,
  pinchZoomSensitivity: 0.01,
  zoomSensitivity: 0.001,
  panSpeed: 15,
  momentum: {
    friction: 0.92,
    minVelocity: 0.5,
  },
  spring: {
    stiffness: 200,
    damping: 30,
  },
  animationDuration: 300,
} as const;

export const DEFAULT_CAMERA = {
  x: 0,
  y: 0,
  zoom: CAMERA.defaultZoom,
} as const;

// =============================================================================
// Physics Engine (Matter.js)
// =============================================================================

export const PHYSICS: PhysicsConfig = {
  friction: 0.05,
  frictionAir: 0.01,
  restitution: 0.7,
  density: 0.001,
  sleepThreshold: 120,
  settlingStrength: 0.002,
};

export const PHYSICS_MOBILE: PhysicsConfig = {
  friction: 0.08,
  frictionAir: 0.02,
  restitution: 0.6,
  density: 0.001,
  sleepThreshold: 80,
  settlingStrength: 0.003,
};

// =============================================================================
// Search Card
// =============================================================================

const SEARCH_CARD_DIMENSIONS = getCardDimensions('2x1');

export const SEARCH_CARD = {
  /** Width when expanded. */
  EXPANDED_WIDTH: SEARCH_CARD_DIMENSIONS.width,
  /** Height when expanded. */
  EXPANDED_HEIGHT: SEARCH_CARD_DIMENSIONS.height,
  /** Height when collapsed to top/bottom edge bar. */
  COLLAPSED_HEIGHT: 56,
  /** Minimum width when compressed against a side edge. */
  SQUASHED_SIDE_WIDTH: 80,
  /** Off-screen distance needed to reach the fully squashed state. */
  COMPRESSION_DISTANCE: 180,
  /** Distance from viewport edge to trigger sticky behavior (px). */
  STICKY_THRESHOLD: 60,
  /** Padding from viewport edge when stuck/collapsed. */
  EDGE_PADDING: 16,
  /** @deprecated Use STICKY_THRESHOLD. */
  threshold: 60,
  /** @deprecated Use EDGE_PADDING. */
  edgePadding: 16,
  /** @deprecated Use EXPANDED_WIDTH. */
  cardWidth: SEARCH_CARD_DIMENSIONS.width,
  /** @deprecated Use EXPANDED_HEIGHT. */
  cardHeight: SEARCH_CARD_DIMENSIONS.height,
  /** Extra padding around clamped search card for layout exclusion. */
  EXCLUSION_PADDING: 24,
  expandedWidth: SEARCH_CARD_DIMENSIONS.width,
  /** Height when expanded. */
  expandedHeight: SEARCH_CARD_DIMENSIONS.height,
  /** Height when collapsed to top/bottom edge bar. */
  collapsedHeight: 56,
  /** Minimum width when compressed against a side edge. */
  squashedSideWidth: 80,
  /** Off-screen distance needed to reach the fully squashed state. */
  compressionDistance: 180,
  /** Distance from viewport edge to trigger sticky behavior (px). */
  stickyThreshold: 60,
  /** Extra padding around clamped search card for layout exclusion. */
  exclusionPadding: 24,
  spring: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 35,
  },
} as const;

/** @deprecated Use SEARCH_CARD. Kept during the refactor bridge. */
export const STICKY = SEARCH_CARD;

// =============================================================================
// Animation
// =============================================================================

export const ANIMATION = {
  cardEnter: 300,
  cardExit: 200,
  stagger: 30,
  fadeOutDuration: 250,
  settleDelay: 100,
  fadeInDelay: 300,
  fadeInDuration: 300,
  entranceStagger: 30,
  hoverScale: 1.02,
  hoverDuration: 150,
  spring: {
    stiffness: 180,
    damping: 25,
  },
} as const;

// =============================================================================
// Viewport & Performance
// =============================================================================

export const VIEWPORT_BUFFER = 200;

export const SPATIAL_HASH_CELL_SIZE = 500;

export const PERFORMANCE = {
  maxVisibleCards: 50,
  maxVisibleCardsMobile: 25,
  physicsUpdateRate: 16,
  engineTickRate: 16,
  maxPhysicsBodies: 100,
  throttleInterval: 16,
  lowPerfMaxCards: 15,
  lowFpsThreshold: 30,
  MAX_VISIBLE_CARDS: 50,
  MAX_VISIBLE_CARDS_MOBILE: 25,
  PHYSICS_UPDATE_RATE: 16,
  ENGINE_TICK_RATE: 16,
  MAX_PHYSICS_BODIES: 100,
  THROTTLE_INTERVAL: 16,
  LOW_PERF_MAX_CARDS: 15,
  LOW_FPS_THRESHOLD: 30,
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
// Mobile
// =============================================================================

export const MOBILE = {
  breakpoint: 768,
  cardWidthPercent: 0.9,
  cardMaxWidth: 400,
  scrollGap: 16,
  scrollPadding: 24,
  BREAKPOINT: 768,
  CARD_WIDTH_PERCENT: 0.9,
  CARD_MAX_WIDTH: 400,
  SCROLL_GAP: 16,
  SCROLL_PADDING: 24,
} as const;

// =============================================================================
// Z-Index Layers
// =============================================================================

export const Z_INDEX = {
  canvas: 1,
  cards: 10,
  searchCard: 50,
  searchCardSticky: 100,
  controls: 110,
} as const;

// =============================================================================
// Interaction
// =============================================================================

export const INTERACTION = {
  dragThreshold: 5,
  clickMaxDuration: 200,
  touchTargetMin: 44,
  DRAG_THRESHOLD: 5,
  CLICK_MAX_DURATION: 200,
  TOUCH_TARGET_MIN: 44,
} as const;

// =============================================================================
// Keyboard Shortcuts
// =============================================================================

export const KEYBOARD = {
  pan: {
    up: ['w', 'W', 'ArrowUp'],
    down: ['s', 'S', 'ArrowDown'],
    left: ['a', 'A', 'ArrowLeft'],
    right: ['d', 'D', 'ArrowRight'],
  },
  card: {
    up: ['ArrowUp'],
    down: ['ArrowDown'],
    left: ['ArrowLeft'],
    right: ['ArrowRight'],
  },
  select: ['Enter', ' '],
  blur: ['Escape'],
  reset: ['r', 'R'],
  back: ['Backspace'],
  close: ['Escape'],
  search: ['/', 'f', 'F'],
  cycle: ['Tab'],
  zoomIn: ['+', '='],
  zoomOut: ['-', '_'],
  PAN_UP: ['w', 'W'],
  PAN_DOWN: ['s', 'S'],
  PAN_LEFT: ['a', 'A'],
  PAN_RIGHT: ['d', 'D'],
  CARD_UP: ['ArrowUp'],
  CARD_DOWN: ['ArrowDown'],
  CARD_LEFT: ['ArrowLeft'],
  CARD_RIGHT: ['ArrowRight'],
  SELECT: ['Enter', ' '],
  BLUR: ['Escape'],
  RESET: ['r', 'R'],
  BACK: ['Backspace'],
  CLOSE: ['Escape'],
  SEARCH: ['/', 'f', 'F'],
  CYCLE: ['Tab'],
  ZOOM_IN: ['+', '='],
  ZOOM_OUT: ['-', '_'],
} as const;

// =============================================================================
// Storage
// =============================================================================

export const STORAGE_KEY = 'bentosite-bento-grid-camera';
