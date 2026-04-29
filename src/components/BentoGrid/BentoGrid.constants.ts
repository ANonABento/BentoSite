import type { CardSize, GridTheme, PhysicsConfig, ThemeConfig } from './BentoGrid.types';

export const GRID = {
  cellSize: 180,
  gap: 12,
  spawnBuffer: 100,
  despawnBuffer: 200,
  CELL_SIZE: 180,
  GAP: 12,
  SPAWN_BUFFER: 100,
  DESPAWN_BUFFER: 200,
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
    width: cols * GRID.cellSize + (cols - 1) * GRID.gap,
    height: rows * GRID.cellSize + (rows - 1) * GRID.gap,
  };
}

export const CARD_POOL = {
  spawnDelay: 100,
  maxVisible: 30,
  initialSpawnCount: 12,
  initialStagger: 50,
  policy: 'FIFO',
  SPAWN_DELAY: 100,
  MAX_VISIBLE: 30,
  INITIAL_SPAWN_COUNT: 12,
  INITIAL_STAGGER: 50,
  POLICY: 'FIFO',
} as const;

/** @deprecated Use CARD_POOL. */
export const QUEUE = CARD_POOL;

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
  minZoom: 0.4,
  maxZoom: 2.0,
  defaultZoom: 1,
  keyboardPanSpeed: 30,
  wheelZoomOutFactor: 0.9,
  wheelZoomInFactor: 1.1,
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
} as const;

export const DEFAULT_CAMERA = {
  x: CAMERA.DEFAULT.x,
  y: CAMERA.DEFAULT.y,
  zoom: CAMERA.DEFAULT.zoom,
} as const;

export const INTERACTION = {
  dragThreshold: 5,
  clickMaxDuration: 200,
  touchTargetMin: 44,
  DRAG_THRESHOLD: 5,
  CLICK_MAX_DURATION: 200,
  TOUCH_TARGET_MIN: 44,
} as const;

const SEARCH_CARD_DIMENSIONS = getCardDimensions('2x1');

export const SEARCH_CARD = {
  expandedWidth: SEARCH_CARD_DIMENSIONS.width,
  expandedHeight: SEARCH_CARD_DIMENSIONS.height,
  collapsedHeight: 56,
  squashedSideWidth: 80,
  compressionDistance: 180,
  stickyThreshold: 60,
  edgePadding: 16,
  exclusionPadding: 24,
  cardWidth: SEARCH_CARD_DIMENSIONS.width,
  cardHeight: SEARCH_CARD_DIMENSIONS.height,
  threshold: 60,
  EXPANDED_WIDTH: SEARCH_CARD_DIMENSIONS.width,
  EXPANDED_HEIGHT: SEARCH_CARD_DIMENSIONS.height,
  COLLAPSED_HEIGHT: 56,
  SQUASHED_SIDE_WIDTH: 80,
  COMPRESSION_DISTANCE: 180,
  STICKY_THRESHOLD: 60,
  EDGE_PADDING: 16,
  EXCLUSION_PADDING: 24,
} as const;

/** @deprecated Use SEARCH_CARD. */
export const STICKY = SEARCH_CARD;

export const ANIMATION = {
  cardEnter: 300,
  cardExit: 200,
  stagger: 30,
  CARD_ENTER: 300,
  CARD_EXIT: 200,
  STAGGER: 30,
  SPRING: {
    stiffness: 180,
    damping: 25,
  },
} as const;

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

export const THEME_PLAYFUL: ThemeConfig = {
  name: 'playful',
  background: 'radial-gradient(ellipse at center, var(--surface-deep) 0%, var(--background) 100%)',
  card: {
    background: 'linear-gradient(135deg, var(--purple-muted) 0%, var(--orange-muted) 100%)',
    border: '2px solid var(--purple-muted)',
    borderRadius: 20,
    shadow: '0 0 20px var(--purple-muted), 0 8px 32px var(--shadow-color)',
    hoverShadow: '0 0 40px var(--purple-muted), 0 12px 48px var(--shadow-color)',
    rotationRange: 3,
  },
  accent: {
    primary: 'var(--purple)',
    secondary: 'var(--orange)',
    tertiary: 'var(--purple-hover)',
  },
  searchCard: {
    background: 'var(--overlay-strong)',
    border: '2px solid var(--purple-muted)',
  },
};

export const THEME_PREMIUM: ThemeConfig = {
  name: 'premium',
  background: 'linear-gradient(180deg, var(--background) 0%, var(--surface-deep) 100%)',
  card: {
    background: 'var(--glass-bg-strong)',
    border: '1px solid var(--glass-border)',
    borderRadius: 8,
    shadow: '0 4px 24px var(--shadow-color)',
    hoverShadow: '0 8px 40px var(--shadow-color), 0 0 0 1px var(--purple-muted)',
    rotationRange: 0,
  },
  accent: {
    primary: 'var(--purple)',
    secondary: 'var(--orange)',
  },
  searchCard: {
    background: 'var(--overlay-strong)',
    border: '1px solid var(--glass-border)',
  },
};

export const THEMES = {
  playful: THEME_PLAYFUL,
  premium: THEME_PREMIUM,
} satisfies Record<GridTheme, ThemeConfig>;

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
