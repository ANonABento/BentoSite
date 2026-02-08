// Dimension.tsx - Configuration and Constants

import type { ModelInfo } from './Dimension.types';

// Model Configuration - Add your models here
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'placeholder',
    name: 'Default Placeholder',
    path: '/models/placeholder.stl',
    thumbnail: '/models/thumbnails/placeholder.png',
    fileSize: 45672,
    dimensions: { width: 20, height: 20, depth: 20 },
    vertexCount: 2400,
    description: 'Default placeholder model for testing',
    category: 'Basic'
  },
  // Add more models here as needed
  // {
  //   id: 'chair',
  //   name: 'Modern Chair',
  //   path: '/models/chair.stl',
  //   thumbnail: '/models/thumbnails/chair.png',
  //   fileSize: 156000,
  //   dimensions: { width: 15, height: 20, depth: 15 },
  //   vertexCount: 5600,
  //   description: '3D model of a modern dining chair',
  //   category: 'Furniture'
  // },
  // {
  //   id: 'vase',
  //   name: 'Ceramic Vase',
  //   path: '/models/vase.stl',
  //   thumbnail: '/models/thumbnails/vase.png',
  //   fileSize: 89000,
  //   dimensions: { width: 8, height: 25, depth: 8 },
  //   vertexCount: 3200,
  //   description: 'Decorative ceramic vase model',
  //   category: 'Decorative'
  // }
];

// Default model path
export const DEFAULT_MODEL_PATH = '/models/placeholder.stl';

// Camera settings
export const CAMERA_POSITION = [8, 8, 8] as const;
export const CAMERA_FOV = 50;

// Grid settings
export const GRID_SIZE = 20;
export const GRID_CELL_SIZE = 1;
export const GRID_SECTION_SIZE = 5;

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

// Lighting settings
export const AMBIENT_LIGHT_INTENSITY = 0.3;
export const MAIN_LIGHT_INTENSITY_DESKTOP = 0.8;
export const MAIN_LIGHT_INTENSITY_MOBILE = 0.6;
export const SECONDARY_LIGHT_INTENSITY_DESKTOP = 0.4;
export const SECONDARY_LIGHT_INTENSITY_MOBILE = 0.2;

// Animation settings
export const ROTATION_SPEED_X = 0.2;
export const ROTATION_SPEED_Y = 0.3;

// LOD (Level of Detail) thresholds
export const LOD_DISTANCE_DESKTOP_HIGH = 10;
export const LOD_DISTANCE_DESKTOP_MEDIUM = 20;
export const LOD_DISTANCE_MOBILE_HIGH = 5;
export const LOD_DISTANCE_MOBILE_MEDIUM = 10;

// Mobile responsive thresholds
export const MOBILE_BREAKPOINT_WIDTH = 768;
export const LOW_FPS_THRESHOLD = 30;

// Performance settings
export const MIN_PERFORMANCE_SCALE = 0.5;
export const MOBILE_PIXEL_RATIO_MAX = 1.5;