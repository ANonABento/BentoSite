import * as THREE from 'three';

export const SCENE_COLORS = {
  error: '#dc2626',
  errorText: '#ef4444',
  muted: '#9ca3af',
  model: '#666666',
  skeleton: '#444444',
} as const;

export const GRID_STYLE = {
  cellSize: 1,
  cellThickness: 0.5,
  cellColor: 'rgba(148, 148, 148, 1)',
  sectionSize: 5,
  sectionThickness: 1,
  sectionColor: 'rgba(138, 138, 138, 1)',
  fadeStrength: 3,
} as const;

export const ORIGIN = new THREE.Vector3(0, 0, 0);
