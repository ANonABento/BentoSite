/**
 * Bento Hub Configuration - Physics and bento cards
 */

import {
  PhysicsConfig,
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
};

// Grid template for desktop (3x3 uniform)
export const GRID_TEMPLATE_DESKTOP = `
  "reaction typing rhythm"
  "minesweeper game2048 sorting"
  "aim pacman soundboard"
`;

// Grid template for mobile (2 columns)
export const GRID_TEMPLATE_MOBILE = `
  "reaction typing"
  "rhythm minesweeper"
  "game2048 sorting"
  "aim pacman"
  "soundboard soundboard"
`;

// Bento card definitions - all uniform size (1x1)
export const BENTO_CARDS: BentoCardConfig[] = [
  {
    id: 'reaction',
    size: '1x1',
    contentType: 'game',
    title: 'Reaction',
    description: 'Test your reflexes',
    color: 'gold',
    href: '/playground/reaction',
    gridArea: 'reaction',
  },
  {
    id: 'typing',
    size: '1x1',
    contentType: 'game',
    title: 'Typing',
    description: 'Speed test',
    color: 'purple',
    href: '/playground/typing',
    gridArea: 'typing',
  },
  {
    id: 'rhythm',
    size: '1x1',
    contentType: 'game',
    title: 'Rhythm',
    description: 'Feel the beat',
    color: 'gold',
    href: '/playground/rhythm',
    gridArea: 'rhythm',
  },
  {
    id: 'minesweeper',
    size: '1x1',
    contentType: 'game',
    title: 'Mines',
    description: 'Clear the field',
    color: 'purple',
    href: '/playground/minesweeper',
    gridArea: 'minesweeper',
  },
  {
    id: 'game2048',
    size: '1x1',
    contentType: 'game',
    title: '2048',
    description: 'Merge tiles',
    color: 'gold',
    href: '/playground/2048',
    gridArea: 'game2048',
  },
  {
    id: 'sorting',
    size: '1x1',
    contentType: 'game',
    title: 'Sort',
    description: 'Visualize algorithms',
    color: 'cyan',
    href: '/playground/sorting',
    gridArea: 'sorting',
  },
  {
    id: 'aim',
    size: '1x1',
    contentType: 'game',
    title: 'Aim',
    description: '3D target practice',
    color: 'purple',
    href: '/playground/aim-trainer',
    gridArea: 'aim',
  },
  {
    id: 'pacman',
    size: '1x1',
    contentType: 'game',
    title: 'Pacman',
    description: 'Classic arcade',
    color: 'gold',
    href: '/playground/pacman',
    gridArea: 'pacman',
  },
  {
    id: 'soundboard',
    size: '1x1',
    contentType: 'game',
    title: 'Sound',
    description: 'Make noise',
    color: 'cyan',
    href: '/playground/soundboard',
    gridArea: 'soundboard',
  },
];

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
