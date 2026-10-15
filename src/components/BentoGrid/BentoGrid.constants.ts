import type { CardData, CardSize, GridTheme, ThemeConfig } from './BentoGrid.types';

const GRID_VALUES = {
  cellSize: 220,
  // The tray's wall thickness, as on the project pages (--spacing-wall).
  gap: 6,
  spawnBuffer: 100,
  // Cards render this far past the viewport, so a fast pan never shows an empty edge.
  despawnBuffer: 600,
} as const;

export const GRID = {
  CELL_SIZE: GRID_VALUES.cellSize,
  GAP: GRID_VALUES.gap,
  SPAWN_BUFFER: GRID_VALUES.spawnBuffer,
  DESPAWN_BUFFER: GRID_VALUES.despawnBuffer,
  cellSize: GRID_VALUES.cellSize,
  gap: GRID_VALUES.gap,
  spawnBuffer: GRID_VALUES.spawnBuffer,
  despawnBuffer: GRID_VALUES.despawnBuffer,
} as const;

/** Distance from one grid cell to the next: a cell plus the gap. */
export const GRID_STEP = GRID.CELL_SIZE + GRID.GAP;

/** A size's footprint in cells. */
export function cardSpan(size: CardSize): { cols: number; rows: number } {
  const [cols, rows] = size.split('x').map(Number);
  return { cols, rows };
}

export function getCardDimensions(size: CardSize): { width: number; height: number } {
  const { cols, rows } = cardSpan(size);
  return {
    width: cols * GRID.CELL_SIZE + (cols - 1) * GRID.GAP,
    height: rows * GRID.CELL_SIZE + (rows - 1) * GRID.GAP,
  };
}

const CAMERA_VALUES = {
  default: { x: 0, y: 0, zoom: 1 },
  minZoom: 0.3,
  maxZoom: 2.0,
  zoomSensitivity: 0.001,
  panSpeed: 15,
  momentumFriction: 0.92,
  minVelocity: 0.5,
  springStiffness: 200,
  springDamping: 30,
  // WASD: top speed in screen px per second, and how fast it eases to and
  // from that speed (per second; higher is snappier).
  keyboardPanSpeed: 1100,
  keyboardPanResponse: 9,
  wheelZoomOutFactor: 0.9,
  wheelZoomInFactor: 1.1,
  // Window size at which the board renders at zoom 1, and the range fitZoom may use.
  referenceWidth: 1760,
  referenceHeight: 1040,
  minFitZoom: 0.7,
  maxFitZoom: 1.25,
  // The visitor's zoom steps, as multiples of fitZoom (1 is the default).
  zoomLevels: [0.6, 0.8, 1, 1.25, 1.5],
  zoomGlideMs: 220,
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
  keyboardPanResponse: CAMERA_VALUES.keyboardPanResponse,
  wheelZoomOutFactor: CAMERA_VALUES.wheelZoomOutFactor,
  wheelZoomInFactor: CAMERA_VALUES.wheelZoomInFactor,
  referenceWidth: CAMERA_VALUES.referenceWidth,
  referenceHeight: CAMERA_VALUES.referenceHeight,
  minFitZoom: CAMERA_VALUES.minFitZoom,
  maxFitZoom: CAMERA_VALUES.maxFitZoom,
  zoomLevels: CAMERA_VALUES.zoomLevels,
  zoomGlideMs: CAMERA_VALUES.zoomGlideMs,
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
  zoom: CAMERA.defaultZoom,
} as const;

export const INTERACTION = {
  DRAG_THRESHOLD: 5,
  CLICK_MAX_DURATION: 200,
  TOUCH_TARGET_MIN: 44,
  dragThreshold: 5,
  clickMaxDuration: 200,
  touchTargetMin: 44,
} as const;

const SEARCH_CARD_DIMENSIONS = getCardDimensions('2x1');
const SEARCH_CARD_VALUES = {
  expandedWidth: SEARCH_CARD_DIMENSIONS.width,
  expandedHeight: SEARCH_CARD_DIMENSIONS.height,
  // Just the input row: the full card folds down to this against a top or bottom edge.
  collapsedHeight: 72,
  // Against a side edge it shrinks to a drawer tab this size.
  squashedSideWidth: 56,
  squashedSideHeight: 148,
  // How far past an edge the slot goes before the card is fully a tab or bar.
  compressionDistance: 80,
  stickyThreshold: 60,
  edgePadding: 16,
  exclusionPadding: 24,
} as const;

export const SEARCH_CARD = {
  EXPANDED_WIDTH: SEARCH_CARD_VALUES.expandedWidth,
  EXPANDED_HEIGHT: SEARCH_CARD_VALUES.expandedHeight,
  COLLAPSED_HEIGHT: SEARCH_CARD_VALUES.collapsedHeight,
  SQUASHED_SIDE_WIDTH: SEARCH_CARD_VALUES.squashedSideWidth,
  SQUASHED_SIDE_HEIGHT: SEARCH_CARD_VALUES.squashedSideHeight,
  COMPRESSION_DISTANCE: SEARCH_CARD_VALUES.compressionDistance,
  STICKY_THRESHOLD: SEARCH_CARD_VALUES.stickyThreshold,
  EDGE_PADDING: SEARCH_CARD_VALUES.edgePadding,
  EXCLUSION_PADDING: SEARCH_CARD_VALUES.exclusionPadding,
  expandedWidth: SEARCH_CARD_VALUES.expandedWidth,
  expandedHeight: SEARCH_CARD_VALUES.expandedHeight,
  collapsedHeight: SEARCH_CARD_VALUES.collapsedHeight,
  squashedSideWidth: SEARCH_CARD_VALUES.squashedSideWidth,
  compressionDistance: SEARCH_CARD_VALUES.compressionDistance,
  stickyThreshold: SEARCH_CARD_VALUES.stickyThreshold,
  threshold: SEARCH_CARD_VALUES.stickyThreshold,
  edgePadding: SEARCH_CARD_VALUES.edgePadding,
  exclusionPadding: SEARCH_CARD_VALUES.exclusionPadding,
  cardWidth: SEARCH_CARD_VALUES.expandedWidth,
  cardHeight: SEARCH_CARD_VALUES.expandedHeight,
} as const;

export const STICKY = SEARCH_CARD;

export const ANIMATION = {
  CARD_ENTER: 300,
  CARD_EXIT: 200,
  STAGGER: 30,
  SPRING: {
    stiffness: 180,
    damping: 25,
  },
} as const;

export const THEME_PLAYFUL: ThemeConfig = {
  name: 'playful',
  background: 'radial-gradient(ellipse at center, var(--surface-deep) 0%, var(--background) 100%)',
  card: {
    background: 'linear-gradient(135deg, var(--primary-muted) 0%, var(--orange-muted) 100%)',
    border: '2px solid var(--primary-muted)',
    borderRadius: 20,
    shadow: '0 0 20px var(--primary-muted), 0 8px 32px var(--shadow-color)',
    hoverShadow: '0 0 40px var(--primary-muted), 0 12px 48px var(--shadow-color)',
    rotationRange: 0,
  },
  accent: {
    primary: 'var(--primary)',
    secondary: 'var(--primary-active)',
    tertiary: 'var(--primary-hover)',
  },
  searchCard: {
    background: 'var(--overlay-strong)',
    border: '2px solid var(--purple-muted)',
  },
};

export const THEME_PREMIUM: ThemeConfig = {
  name: 'premium',
  // The canvas paints its own background from the board palette (.board-canvas).
  background: 'var(--board-bg)',
  // Compartments sit flush in the tray: no drop shadow, radius as on the project pages.
  card: {
    background: 'var(--board-card)',
    border: '1px solid var(--board-card-border)',
    borderRadius: 14,
    shadow: 'none',
    hoverShadow: '0 0 0 1px var(--primary-muted)',
    rotationRange: 0,
  },
  accent: {
    primary: 'var(--primary)',
    secondary: 'var(--primary-active)',
  },
  searchCard: {
    background: 'var(--overlay-strong)',
    border: '1px solid var(--glass-border)',
  },
};

export const THEME_GALLERY: ThemeConfig = {
  name: 'gallery',
  background: 'linear-gradient(180deg, #050505 0%, #11100e 58%, #050505 100%)',
  card: {
    background: 'rgba(255, 255, 255, 0.035)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    shadow: '0 6px 28px rgba(0, 0, 0, 0.45)',
    hoverShadow: '0 12px 42px rgba(0, 0, 0, 0.62), 0 0 0 1px rgba(224, 123, 60, 0.35)',
    rotationRange: 0,
  },
  accent: {
    primary: 'var(--orange)',
    secondary: 'var(--purple)',
  },
  searchCard: {
    background: 'rgba(8, 8, 8, 0.88)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  },
};

export const THEME_ARCADE: ThemeConfig = {
  name: 'arcade',
  background:
    'radial-gradient(circle at 50% 42%, rgba(167, 139, 250, 0.14), transparent 34%), linear-gradient(180deg, var(--pg-bg-deep) 0%, #08080f 56%, #040407 100%)',
  card: {
    background: 'var(--pg-bg-surface)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    shadow: '0 10px 34px rgba(0, 0, 0, 0.46)',
    hoverShadow: '0 18px 48px rgba(0, 0, 0, 0.58), 0 0 0 1px rgba(167, 139, 250, 0.28)',
    rotationRange: 0,
  },
  accent: {
    primary: 'var(--orange)',
    secondary: 'var(--purple)',
  },
  searchCard: {
    background: 'rgba(12, 12, 20, 0.92)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  },
};

export const THEMES = {
  playful: THEME_PLAYFUL,
  premium: THEME_PREMIUM,
  gallery: THEME_GALLERY,
  arcade: THEME_ARCADE,
} satisfies Record<GridTheme, ThemeConfig>;

export const SEARCH_CARD_ID = '__search__' as const;

/** Pinned cards (the intro, plus any flagged `pinned`) stay on the board permanently. */
export function isPinnedCard(card: Pick<CardData, 'type' | 'pinned'> | undefined): boolean {
  return card?.type === 'intro' || Boolean(card?.pinned);
}
export const INFO_CARD_ID = '__info__' as const;

export const MOBILE = {
  BREAKPOINT: 768,
  CARD_WIDTH_PERCENT: 0.9,
  CARD_MAX_WIDTH: 400,
  SCROLL_GAP: 16,
  SCROLL_PADDING: 16,
  TRAY_GAP: 10,
  TRAY_MAX_WIDTH: 560,
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
