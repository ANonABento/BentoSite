// InfiniteGrid v2 Constants
// Configuration for canvas, physics, sticky behavior, and layout

import type { GridConfig, PhysicsConfig } from './InfiniteGrid.types';

// =============================================================================
// Camera & Canvas
// =============================================================================

export const CAMERA = {
  // Zoom limits
  minZoom: 0.3,
  maxZoom: 2.5,
  defaultZoom: 1.0,
  // Keyboard pan speed (pixels per keypress)
  keyboardPanSpeed: 30,
  // Scroll wheel pan multiplier
  wheelPanMultiplier: 1.5,
  // Pinch zoom sensitivity
  pinchZoomSensitivity: 0.01,
  // Momentum after releasing drag
  momentum: {
    friction: 0.92,     // Velocity multiplier per frame
    minVelocity: 0.5,   // Stop momentum below this
  },
  // Smooth animation duration (ms)
  animationDuration: 300,
} as const;

export const DEFAULT_CAMERA = {
  x: 0,
  y: 0,
  zoom: 1,
} as const;

// =============================================================================
// Physics Engine (Matter.js)
// =============================================================================

export const PHYSICS: PhysicsConfig = {
  friction: 0.05,          // Lower friction for smoother sliding
  frictionAir: 0.01,       // Lower air resistance for more movement
  restitution: 0.7,        // More bouncy collisions
  density: 0.001,          // Lighter cards respond more
  sleepThreshold: 120,     // Higher threshold - bodies stay awake longer
  settlingStrength: 0.002, // Stronger settling force - cards snap back faster
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
// Sticky Search Card
// =============================================================================

export const STICKY = {
  // Distance from viewport edge to trigger sticky (px)
  threshold: 60,
  // Padding from edge when stuck (px)
  edgePadding: 16,
  // Search card size - matches 2x1 bento card: 2*cellSize + gap = 2*200 + 16 = 416
  cardWidth: 416,
  cardHeight: 200,
  // Extra padding around clamped search card for layout exclusion
  exclusionPadding: 24,
  // Spring animation for sticky transition
  spring: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 35,
  },
} as const;

// =============================================================================
// Grid Layout
// =============================================================================

export const GRID: GridConfig = {
  cellSize: 200,
  columns: 6,
  gap: 16,
};

export const CARD_SIZES = {
  '1x1': { cols: 1, rows: 1 },
  '2x1': { cols: 2, rows: 1 },
  '1x2': { cols: 1, rows: 2 },
  '2x2': { cols: 2, rows: 2 },
} as const;

// =============================================================================
// Animation Timing
// =============================================================================

export const ANIMATION = {
  // Filter transition timing
  fadeOutDuration: 250,   // Removed cards fade out
  settleDelay: 100,       // Delay before settling starts
  fadeInDelay: 300,       // Delay before new cards fade in
  fadeInDuration: 300,    // New cards fade in duration
  // Entrance animation
  entranceStagger: 30,    // Stagger between cards on initial load
  // Card hover/interaction
  hoverScale: 1.02,
  hoverDuration: 150,
} as const;

// =============================================================================
// Viewport & Performance
// =============================================================================

export const VIEWPORT_BUFFER = 200;

export const SPATIAL_HASH_CELL_SIZE = 500;

export const PERFORMANCE = {
  maxVisibleCards: 50,
  maxVisibleCardsMobile: 25,
  physicsUpdateRate: 16,   // ~60fps for React state updates (better visual sync)
  engineTickRate: 16,      // ~60fps for Matter.js
  maxPhysicsBodies: 100,
} as const;

// =============================================================================
// Z-Index Layers
// =============================================================================

export const Z_INDEX = {
  canvas: 1,
  cards: 10,
  searchCard: 50,         // Above cards when in canvas
  searchCardSticky: 100,  // Above everything when stuck
  controls: 110,
} as const;

// =============================================================================
// Interaction
// =============================================================================

export const INTERACTION = {
  // Click vs drag threshold (canvas pan)
  dragThreshold: 5,
  // Touch target minimum size
  touchTargetMin: 44,
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
  reset: ['r', 'R'],
  close: ['Escape'],
  zoomIn: ['+', '='],
  zoomOut: ['-', '_'],
} as const;

// =============================================================================
// Storage
// =============================================================================

export const STORAGE_KEY = 'bentosite-infinite-grid-camera';
