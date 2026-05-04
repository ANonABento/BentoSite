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
  gravityStrength: 0.07,
  collisionPadding: 18,
  collisionForce: 0.45,
  dragElastic: 0.12,
  returnSpring: {
    stiffness: 210,
    damping: 26,
  },
  centerPullRadius: 400,
  dampingFactor: 0.92,
};

// Particle system configuration (improved - less ugly)
export const PARTICLES: ParticleConfig = {
  count: 600,
  countMobile: 200,
  size: 2,
  sizeVariance: 1,
  color: '#e07b3c',
  colorSecondary: '#e07b3c',
  spiralSpeed: 0.0004,
  inwardSpeed: 0.0002,
  respawnRadius: 12,
  eventHorizonRadius: 0.5,
  opacity: 0.35,
};

// Central void effect configuration
export const VOID: VoidConfig = {
  glowColor: '#e07b3c',
  glowIntensity: 0.3,
  coreColor: '#050612',
  pulseSpeed: 1.5,
};

// Grid template for desktop
export const GRID_TEMPLATE_DESKTOP = `
  "rhythm rhythm stats"
  "reaction typing sorting"
  "minesweeper game2048 soundboard"
  "pacman pacman aim"
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
    color: 'primary',
    href: '/playground/reaction',
    gridArea: 'reaction',
  },
  {
    id: 'typing',
    size: '1x1',
    contentType: 'game',
    title: 'Typing',
    description: 'WPM and accuracy',
    color: 'primary',
    href: '/playground/typing',
    gridArea: 'typing',
  },
  {
    id: 'rhythm',
    size: '2x1',
    contentType: 'game',
    title: 'Rhythm',
    description: 'Beatmaps, uploads, and score chasing',
    color: 'primary',
    href: '/playground/rhythm',
    gridArea: 'rhythm',
  },
  {
    id: 'minesweeper',
    size: '1x1',
    contentType: 'game',
    title: 'Mines',
    description: 'Speed clear logic',
    color: 'primary',
    href: '/playground/minesweeper',
    gridArea: 'minesweeper',
  },
  {
    id: 'game2048',
    size: '1x1',
    contentType: 'game',
    title: '2048',
    description: 'Route planning by merge',
    color: 'primary',
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
    color: 'primary',
    href: '/playground/aim-trainer',
    gridArea: 'aim',
  },
  {
    id: 'pacman',
    size: '2x1',
    contentType: 'game',
    title: 'Pacman',
    description: 'Arcade classic with room to breathe',
    color: 'primary',
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

export const VISIBLE_BENTO_CARDS: BentoCardConfig[] = BENTO_CARDS.filter(
  (card) => card.contentType !== 'void'
);

const GAME_CARDS: BentoCardConfig[] = BENTO_CARDS.filter(
  (card) => card.contentType === 'game'
);

export function getGameCards(): BentoCardConfig[] {
  return [...GAME_CARDS];
}

export function getGridRowCount(template: string): number {
  return template
    .trim()
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean).length;
}

// Cell size in pixels (base unit)
export const CELL_SIZE = {
  desktop: 168,
  mobile: 132,
};

// Gap between cards
export const GRID_GAP = {
  desktop: 18,
  mobile: 14,
};
