/**
 * Aim Trainer - Configuration
 */

import { GameMode, ModeInfo } from './AimTrainer.types';

// Game duration options
export const DURATIONS = [15, 30, 60] as const;
export const DEFAULT_DURATION = 30;

// Target settings
export const TARGET_SIZE_BASE = 0.5;
export const TARGET_SIZES = {
  small: 0.7,
  medium: 1.0,
  large: 1.3,
};

// Sensitivity
export const DEFAULT_SENSITIVITY = 1.0;
export const MIN_SENSITIVITY = 0.2;
export const MAX_SENSITIVITY = 3.0;

// Scoring
export const HIT_SCORE = 100;
export const MISS_PENALTY = 0;

// Mode configurations
export const MODES: ModeInfo[] = [
  {
    id: 'gridShot',
    name: 'Grid Shot',
    description: 'Static targets in a grid pattern. Click to destroy.',
  },
  {
    id: 'spiderShot',
    name: 'Spider Shot',
    description: 'Targets spawn around center. Fast reactions.',
  },
  {
    id: 'tracking',
    name: 'Tracking',
    description: 'Follow and click the moving target.',
  },
  {
    id: 'flick',
    name: 'Flick',
    description: 'Quick flick shots. Target appears briefly.',
  },
];

// Arena settings
export const ARENA = {
  width: 20,
  height: 12,
  depth: 15,
};

// Target spawn settings per mode
export const MODE_SETTINGS: Record<GameMode, {
  maxTargets: number;
  spawnInterval: number;
  targetLifetime: number;
}> = {
  gridShot: {
    maxTargets: 5,
    spawnInterval: 0,
    targetLifetime: Infinity,
  },
  spiderShot: {
    maxTargets: 3,
    spawnInterval: 500,
    targetLifetime: 3000,
  },
  tracking: {
    maxTargets: 1,
    spawnInterval: 0,
    targetLifetime: Infinity,
  },
  flick: {
    maxTargets: 1,
    spawnInterval: 800,
    targetLifetime: 1500,
  },
};

// Colors
export const COLORS = {
  target: '#ef4444',
  targetHit: '#22c55e',
  crosshair: '#ffffff',
  arena: '#1a1a2e',
};
