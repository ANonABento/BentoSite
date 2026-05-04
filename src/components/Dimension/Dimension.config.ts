// Dimension.tsx - Configuration and Constants

import type { ModelInfo } from './Dimension.types';
import { PROCEDURAL_CAT_PATH } from './scene/model-format';

// Model Configuration - Add your models here
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'cat',
    name: 'Cat',
    path: PROCEDURAL_CAT_PATH,
    thumbnail: '/models/thumbnails/placeholder.png',
    fileSize: 0,
    dimensions: { width: 3, height: 3, depth: 4 },
    vertexCount: 0,
    description: 'Default model — a cat. Built procedurally from primitives.',
    category: 'Procedural',
    format: 'procedural',
  },
];

// Default model path
export const DEFAULT_MODEL_PATH = PROCEDURAL_CAT_PATH;

// Camera settings
export const CAMERA_POSITION = [8, 8, 8] as const;
export const CAMERA_FOV = 50;

// Grid settings
export const GRID_SIZE = 20;

// Grid positions for the room environment
export const GRID_POSITIONS = {
  floor: [0, -3, 0] as [number, number, number],
  frontWall: [0, 7, -10] as [number, number, number],
  backWall: [0, 7, 10] as [number, number, number],
  rightWall: [10, 7, 0] as [number, number, number],
  leftWall: [-10, 7, 0] as [number, number, number],
} as const;

// Grid rotations for walls
export const GRID_ROTATIONS = {
  floor: [0, 0, 0] as [number, number, number],
  frontWall: [Math.PI / 2, 0, 0] as [number, number, number],
  backWall: [-Math.PI / 2, 0, 0] as [number, number, number],
  rightWall: [Math.PI / 2, 0, Math.PI / 2] as [number, number, number],
  leftWall: [Math.PI / 2, 0, -Math.PI / 2] as [number, number, number],
} as const;

// Performance settings
export const MIN_PERFORMANCE_SCALE = 0.5;
export const MOBILE_PIXEL_RATIO_MAX = 1.5;
