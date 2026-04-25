/**
 * Playground hub configuration - physics, particles, and card layout
 */

import {
  PhysicsConfig,
  ParticleConfig,
  VoidConfig,
  BentoCardConfig,
} from './BentoHub.types';

// Physics settings for card behavior
export const PHYSICS: PhysicsConfig = {
  gravityStrength: 0.08,
  collisionPadding: 16,
  collisionForce: 0.5,
  dragElastic: 0.15,
  returnSpring: {
    stiffness: 180,
    damping: 22,
  },
  centerPullRadius: 400,
  dampingFactor: 0.95,
};

// Particle system configuration (improved - less ugly)
export const PARTICLES: ParticleConfig = {
  count: 600,
  countMobile: 200,
  size: 2,
  sizeVariance: 1,
  color: '#a78bfa',
  colorSecondary: '#fbbf24',
  spiralSpeed: 0.0004,
  inwardSpeed: 0.0002,
  respawnRadius: 12,
  eventHorizonRadius: 0.5,
  opacity: 0.35,
};

// Central void effect configuration
export const VOID: VoidConfig = {
  glowColor: '#a78bfa',
  glowIntensity: 0.3,
  coreColor: '#050612',
  pulseSpeed: 1.5,
};

// Grid template for desktop
export const GRID_TEMPLATE_DESKTOP = `
  "reaction typing sorting"
  "rhythm rhythm aim"
  "minesweeper game2048 soundboard"
  "pacman pacman stats"
`;

// Grid template for mobile
export const GRID_TEMPLATE_MOBILE = `
  "rhythm rhythm"
  "reaction typing"
  "sorting aim"
  "minesweeper game2048"
  "pacman soundboard"
  "stats stats"
`;

// Bento card definitions
export const BENTO_CARDS: BentoCardConfig[] = [
  {
    id: 'reaction',
    size: '1x1',
    contentType: 'game',
    title: 'Reaction',
    description: 'Pure reflex timing',
    color: 'gold',
    href: '/playground/reaction',
    gridArea: 'reaction',
  },
  {
    id: 'typing',
    size: '1x1',
    contentType: 'game',
    title: 'Typing',
    description: 'WPM and accuracy',
    color: 'purple',
    href: '/playground/typing',
    gridArea: 'typing',
  },
  {
    id: 'rhythm',
    size: '2x1',
    contentType: 'game',
    title: 'Rhythm',
    description: 'Beatmaps, uploads, and score chasing',
    color: 'gold',
    href: '/playground/rhythm',
    gridArea: 'rhythm',
  },
  {
    id: 'minesweeper',
    size: '1x1',
    contentType: 'game',
    title: 'Mines',
    description: 'Speed clear logic',
    color: 'purple',
    href: '/playground/minesweeper',
    gridArea: 'minesweeper',
  },
  {
    id: 'game2048',
    size: '1x1',
    contentType: 'game',
    title: '2048',
    description: 'Route planning by merge',
    color: 'gold',
    href: '/playground/2048',
    gridArea: 'game2048',
  },
  {
    id: 'sorting',
    size: '1x1',
    contentType: 'game',
    title: 'Sort',
    description: 'Algorithm motion study',
    color: 'cyan',
    href: '/playground/sorting',
    gridArea: 'sorting',
  },
  {
    id: 'aim',
    size: '1x1',
    contentType: 'game',
    title: 'Aim',
    description: '3D target tracking',
    color: 'purple',
    href: '/playground/aim-trainer',
    gridArea: 'aim',
  },
  {
    id: 'pacman',
    size: '2x1',
    contentType: 'game',
    title: 'Pacman',
    description: 'Arcade classic with room to breathe',
    color: 'gold',
    href: '/playground/pacman',
    gridArea: 'pacman',
  },
  {
    id: 'soundboard',
    size: '1x1',
    contentType: 'game',
    title: 'Sound',
    description: 'Audio toy box',
    color: 'cyan',
    href: '/playground/soundboard',
    gridArea: 'soundboard',
  },
  {
    id: 'stats',
    size: '1x1',
    contentType: 'stat',
    title: 'Archive',
    description: 'Scores live locally',
    color: 'cyan',
    gridArea: 'stats',
  },
];

// Get card by ID
export function getCardById(id: string): BentoCardConfig | undefined {
  return BENTO_CARDS.find((card) => card.id === id);
}

// Filter out void card for game list
export function getGameCards(): BentoCardConfig[] {
  return BENTO_CARDS.filter((card) => card.contentType === 'game');
}

export function getGridRowCount(template: string): number {
  return template
    .trim()
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean).length;
}

// Size to grid span mapping
export const SIZE_TO_SPAN: Record<string, { cols: number; rows: number }> = {
  '1x1': { cols: 1, rows: 1 },
  '2x1': { cols: 2, rows: 1 },
  '1x2': { cols: 1, rows: 2 },
  '2x2': { cols: 2, rows: 2 },
};

// Cell size in pixels (base unit)
export const CELL_SIZE = {
  desktop: 140,
  mobile: 100,
};

// Gap between cards
export const GRID_GAP = {
  desktop: 16,
  mobile: 12,
};
