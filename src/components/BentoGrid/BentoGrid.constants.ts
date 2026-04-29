import type { CardSize, GridTheme, PhysicsConfig, ThemeConfig } from './BentoGrid.types';

const GRID_VALUES = {
  cellSize: 180,
  gap: 12,
  spawnBuffer: 100,
  despawnBuffer: 200,
} as const;

export const GRID = {
  cellSize: GRID_VALUES.cellSize,
  gap: GRID_VALUES.gap,
  spawnBuffer: GRID_VALUES.spawnBuffer,
  despawnBuffer: GRID_VALUES.despawnBuffer,
  CELL_SIZE: GRID_VALUES.cellSize,
  GAP: GRID_VALUES.gap,
  SPAWN_BUFFER: GRID_VALUES.spawnBuffer,
  DESPAWN_BUFFER: GRID_VALUES.despawnBuffer,
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

const CARD_POOL_VALUES = {
  spawnDelay: 100,
  maxVisible: 30,
  initialSpawnCount: 12,
  initialStagger: 50,
  policy: 'FIFO',
} as const;

export const CARD_POOL = {
  spawnDelay: CARD_POOL_VALUES.spawnDelay,
  maxVisible: CARD_POOL_VALUES.maxVisible,
  initialSpawnCount: CARD_POOL_VALUES.initialSpawnCount,
  initialStagger: CARD_POOL_VALUES.initialStagger,
  policy: CARD_POOL_VALUES.policy,
  SPAWN_DELAY: CARD_POOL_VALUES.spawnDelay,
  MAX_VISIBLE: CARD_POOL_VALUES.maxVisible,
  INITIAL_SPAWN_COUNT: CARD_POOL_VALUES.initialSpawnCount,
  INITIAL_STAGGER: CARD_POOL_VALUES.initialStagger,
  POLICY: CARD_POOL_VALUES.policy,
} as const;

/** @deprecated Use CARD_POOL. */
export const QUEUE = CARD_POOL;

const CAMERA_VALUES = {
  default: { x: 0, y: 0, zoom: 1 },
  minZoom: 0.4,
  maxZoom: 2.0,
  zoomSensitivity: 0.001,
  panSpeed: 15,
  momentumFriction: 0.92,
  minVelocity: 0.5,
  springStiffness: 200,
  springDamping: 30,
  keyboardPanSpeed: 30,
  wheelZoomOutFactor: 0.9,
  wheelZoomInFactor: 1.1,
} as const;

export const CAMERA = {
  DEFAULT: CAMERA_VALUES.default,
  MIN_ZOOM: CAMERA_VALUES.minZoom,
  MAX_ZOOM: CAMERA_VALUES.maxZoom,
  ZOOM_SENSITIVITY: CAMERA_VALUES.zoomSensitivity,
  PAN_SPEED: CAMERA_VALUES.panSpeed,
  MOMENTUM_FRICTION: CAMERA_VALUES.momentumFriction,
  MIN_VELOCITY: CAMERA_VALUES.minVelocity,
  SPRING_STIFFNESS: CAMERA_VALUES.springStiffness,
  SPRING_DAMPING: CAMERA_VALUES.springDamping,
  minZoom: CAMERA_VALUES.minZoom,
  maxZoom: CAMERA_VALUES.maxZoom,
  defaultZoom: CAMERA_VALUES.default.zoom,
  keyboardPanSpeed: CAMERA_VALUES.keyboardPanSpeed,
  wheelZoomOutFactor: CAMERA_VALUES.wheelZoomOutFactor,
  wheelZoomInFactor: CAMERA_VALUES.wheelZoomInFactor,
  zoomSensitivity: CAMERA_VALUES.zoomSensitivity,
  panSpeed: CAMERA_VALUES.panSpeed,
  momentum: {
    friction: CAMERA_VALUES.momentumFriction,
    minVelocity: CAMERA_VALUES.minVelocity,
  },
  spring: {
    stiffness: CAMERA_VALUES.springStiffness,
    damping: CAMERA_VALUES.springDamping,
  },
} as const;

export const DEFAULT_CAMERA = {
  x: CAMERA.DEFAULT.x,
  y: CAMERA.DEFAULT.y,
  zoom: CAMERA.DEFAULT.zoom,
} as const;

const INTERACTION_VALUES = {
  dragThreshold: 5,
  clickMaxDuration: 200,
  touchTargetMin: 44,
} as const;

export const INTERACTION = {
  dragThreshold: INTERACTION_VALUES.dragThreshold,
  clickMaxDuration: INTERACTION_VALUES.clickMaxDuration,
  touchTargetMin: INTERACTION_VALUES.touchTargetMin,
  DRAG_THRESHOLD: INTERACTION_VALUES.dragThreshold,
  CLICK_MAX_DURATION: INTERACTION_VALUES.clickMaxDuration,
  TOUCH_TARGET_MIN: INTERACTION_VALUES.touchTargetMin,
} as const;

const SEARCH_CARD_DIMENSIONS = getCardDimensions('2x1');
const SEARCH_CARD_VALUES = {
  expandedWidth: SEARCH_CARD_DIMENSIONS.width,
  expandedHeight: SEARCH_CARD_DIMENSIONS.height,
  collapsedHeight: 56,
  squashedSideWidth: 80,
  compressionDistance: 180,
  stickyThreshold: 60,
  edgePadding: 16,
  exclusionPadding: 24,
} as const;

export const SEARCH_CARD = {
  expandedWidth: SEARCH_CARD_VALUES.expandedWidth,
  expandedHeight: SEARCH_CARD_VALUES.expandedHeight,
  collapsedHeight: SEARCH_CARD_VALUES.collapsedHeight,
  squashedSideWidth: SEARCH_CARD_VALUES.squashedSideWidth,
  compressionDistance: SEARCH_CARD_VALUES.compressionDistance,
  stickyThreshold: SEARCH_CARD_VALUES.stickyThreshold,
  edgePadding: SEARCH_CARD_VALUES.edgePadding,
  exclusionPadding: SEARCH_CARD_VALUES.exclusionPadding,
  cardWidth: SEARCH_CARD_VALUES.expandedWidth,
  cardHeight: SEARCH_CARD_VALUES.expandedHeight,
  threshold: SEARCH_CARD_VALUES.stickyThreshold,
  EXPANDED_WIDTH: SEARCH_CARD_VALUES.expandedWidth,
  EXPANDED_HEIGHT: SEARCH_CARD_VALUES.expandedHeight,
  COLLAPSED_HEIGHT: SEARCH_CARD_VALUES.collapsedHeight,
  SQUASHED_SIDE_WIDTH: SEARCH_CARD_VALUES.squashedSideWidth,
  COMPRESSION_DISTANCE: SEARCH_CARD_VALUES.compressionDistance,
  STICKY_THRESHOLD: SEARCH_CARD_VALUES.stickyThreshold,
  EDGE_PADDING: SEARCH_CARD_VALUES.edgePadding,
  EXCLUSION_PADDING: SEARCH_CARD_VALUES.exclusionPadding,
} as const;

/** @deprecated Use SEARCH_CARD. */
export const STICKY = SEARCH_CARD;

const ANIMATION_VALUES = {
  cardEnter: 300,
  cardExit: 200,
  stagger: 30,
  springStiffness: 180,
  springDamping: 25,
} as const;

export const ANIMATION = {
  cardEnter: ANIMATION_VALUES.cardEnter,
  cardExit: ANIMATION_VALUES.cardExit,
  stagger: ANIMATION_VALUES.stagger,
  CARD_ENTER: ANIMATION_VALUES.cardEnter,
  CARD_EXIT: ANIMATION_VALUES.cardExit,
  STAGGER: ANIMATION_VALUES.stagger,
  SPRING: {
    stiffness: ANIMATION_VALUES.springStiffness,
    damping: ANIMATION_VALUES.springDamping,
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
