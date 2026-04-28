import type { PhysicsConfig } from './BentoGrid.types';
import { getCardDimensions } from './BentoGrid.layout.constants';

const CARD_POOL_VALUES = {
  spawnDelay: 100,
  maxVisible: 30,
  initialSpawnCount: 12,
  initialStagger: 50,
  policy: 'FIFO',
} as const;

export const CARD_POOL = {
  /** Minimum delay between spawns (ms). */
  spawnDelay: CARD_POOL_VALUES.spawnDelay,
  /** Maximum cards visible at once. */
  maxVisible: CARD_POOL_VALUES.maxVisible,
  /** Initial cards to spawn around center. */
  initialSpawnCount: CARD_POOL_VALUES.initialSpawnCount,
  /** Stagger delay for initial spawn animation (ms). */
  initialStagger: CARD_POOL_VALUES.initialStagger,
  /** Queue policy for cards waiting to respawn. */
  policy: CARD_POOL_VALUES.policy,
  /** @deprecated Use spawnDelay. */
  SPAWN_DELAY: CARD_POOL_VALUES.spawnDelay,
  /** @deprecated Use maxVisible. */
  MAX_VISIBLE: CARD_POOL_VALUES.maxVisible,
  /** @deprecated Use initialSpawnCount. */
  INITIAL_SPAWN_COUNT: CARD_POOL_VALUES.initialSpawnCount,
  /** @deprecated Use initialStagger. */
  INITIAL_STAGGER: CARD_POOL_VALUES.initialStagger,
  /** @deprecated Use policy. */
  POLICY: CARD_POOL_VALUES.policy,
} as const;

/** @deprecated Use CARD_POOL. Kept during the refactor bridge. */
export const QUEUE = CARD_POOL;

const CAMERA_VALUES = {
  default: { x: 0, y: 0, zoom: 1 },
  minZoom: 0.3,
  maxZoom: 2.5,
  zoomSensitivity: 0.001,
  panSpeed: 15,
  momentumFriction: 0.92,
  minVelocity: 0.5,
  springStiffness: 200,
  springDamping: 30,
  keyboardPanSpeed: 30,
  wheelPanMultiplier: 1.5,
  pinchZoomSensitivity: 0.01,
  animationDuration: 300,
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
  wheelPanMultiplier: CAMERA_VALUES.wheelPanMultiplier,
  pinchZoomSensitivity: CAMERA_VALUES.pinchZoomSensitivity,
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
  animationDuration: CAMERA_VALUES.animationDuration,
} as const;

export const DEFAULT_CAMERA = {
  x: CAMERA.DEFAULT.x,
  y: CAMERA.DEFAULT.y,
  zoom: CAMERA.defaultZoom,
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
  /** Width when expanded. */
  EXPANDED_WIDTH: SEARCH_CARD_VALUES.expandedWidth,
  /** Height when expanded. */
  EXPANDED_HEIGHT: SEARCH_CARD_VALUES.expandedHeight,
  /** Height when collapsed to top/bottom edge bar. */
  COLLAPSED_HEIGHT: SEARCH_CARD_VALUES.collapsedHeight,
  /** Minimum width when compressed against a side edge. */
  SQUASHED_SIDE_WIDTH: SEARCH_CARD_VALUES.squashedSideWidth,
  /** Off-screen distance needed to reach the fully squashed state. */
  COMPRESSION_DISTANCE: SEARCH_CARD_VALUES.compressionDistance,
  /** Distance from viewport edge to trigger sticky behavior (px). */
  STICKY_THRESHOLD: SEARCH_CARD_VALUES.stickyThreshold,
  /** Padding from viewport edge when stuck/collapsed. */
  EDGE_PADDING: SEARCH_CARD_VALUES.edgePadding,
  /** @deprecated Use STICKY_THRESHOLD. */
  threshold: SEARCH_CARD_VALUES.stickyThreshold,
  /** @deprecated Use EDGE_PADDING. */
  edgePadding: SEARCH_CARD_VALUES.edgePadding,
  /** @deprecated Use EXPANDED_WIDTH. */
  cardWidth: SEARCH_CARD_VALUES.expandedWidth,
  /** @deprecated Use EXPANDED_HEIGHT. */
  cardHeight: SEARCH_CARD_VALUES.expandedHeight,
  /** Extra padding around clamped search card for layout exclusion. */
  EXCLUSION_PADDING: SEARCH_CARD_VALUES.exclusionPadding,
  expandedWidth: SEARCH_CARD_VALUES.expandedWidth,
  /** Height when expanded. */
  expandedHeight: SEARCH_CARD_VALUES.expandedHeight,
  /** Height when collapsed to top/bottom edge bar. */
  collapsedHeight: SEARCH_CARD_VALUES.collapsedHeight,
  /** Minimum width when compressed against a side edge. */
  squashedSideWidth: SEARCH_CARD_VALUES.squashedSideWidth,
  /** Off-screen distance needed to reach the fully squashed state. */
  compressionDistance: SEARCH_CARD_VALUES.compressionDistance,
  /** Distance from viewport edge to trigger sticky behavior (px). */
  stickyThreshold: SEARCH_CARD_VALUES.stickyThreshold,
  /** Extra padding around clamped search card for layout exclusion. */
  exclusionPadding: SEARCH_CARD_VALUES.exclusionPadding,
  spring: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 35,
  },
} as const;

/** @deprecated Use SEARCH_CARD. Kept during the refactor bridge. */
export const STICKY = SEARCH_CARD;

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

export const VIEWPORT_BUFFER = 200;

export const SPATIAL_HASH_CELL_SIZE = 500;

const PERFORMANCE_VALUES = {
  maxVisibleCards: 50,
  maxVisibleCardsMobile: 25,
  physicsUpdateRate: 16,
  engineTickRate: 16,
  maxPhysicsBodies: 100,
  throttleInterval: 16,
  lowPerfMaxCards: 15,
  lowFpsThreshold: 30,
} as const;

export const PERFORMANCE = {
  maxVisibleCards: PERFORMANCE_VALUES.maxVisibleCards,
  maxVisibleCardsMobile: PERFORMANCE_VALUES.maxVisibleCardsMobile,
  physicsUpdateRate: PERFORMANCE_VALUES.physicsUpdateRate,
  engineTickRate: PERFORMANCE_VALUES.engineTickRate,
  maxPhysicsBodies: PERFORMANCE_VALUES.maxPhysicsBodies,
  throttleInterval: PERFORMANCE_VALUES.throttleInterval,
  lowPerfMaxCards: PERFORMANCE_VALUES.lowPerfMaxCards,
  lowFpsThreshold: PERFORMANCE_VALUES.lowFpsThreshold,
  MAX_VISIBLE_CARDS: PERFORMANCE_VALUES.maxVisibleCards,
  MAX_VISIBLE_CARDS_MOBILE: PERFORMANCE_VALUES.maxVisibleCardsMobile,
  PHYSICS_UPDATE_RATE: PERFORMANCE_VALUES.physicsUpdateRate,
  ENGINE_TICK_RATE: PERFORMANCE_VALUES.engineTickRate,
  MAX_PHYSICS_BODIES: PERFORMANCE_VALUES.maxPhysicsBodies,
  THROTTLE_INTERVAL: PERFORMANCE_VALUES.throttleInterval,
  LOW_PERF_MAX_CARDS: PERFORMANCE_VALUES.lowPerfMaxCards,
  LOW_FPS_THRESHOLD: PERFORMANCE_VALUES.lowFpsThreshold,
} as const;
