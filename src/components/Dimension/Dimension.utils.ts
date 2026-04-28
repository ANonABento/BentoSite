// Dimension.tsx - Utility Functions

import * as THREE from 'three';
import {
  formatFileSize as sharedFormatFileSize,
  formatNumber,
  isMobileDevice as sharedIsMobileDevice,
} from '@/lib/utils';
import { PERFORMANCE } from '@/lib/constants';

export const formatFileSize = sharedFormatFileSize;
export const isMobileDevice = sharedIsMobileDevice;

/**
 * Format vertex count with commas
 */
export const formatVertexCount = formatNumber;

/**
 * Calculate distance from camera to position
 */
export const getDistanceFromCamera = (
  cameraPosition: THREE.Vector3,
  objectPosition?: THREE.Vector3
): number => {
  const targetPosition = objectPosition || new THREE.Vector3(0, 0, 0);
  return cameraPosition.distanceTo(targetPosition);
};

/**
 * Get LOD level based on distance and device performance
 * Uses centralized performance constants
 */
export const getLODLevel = (
  distance: number,
  isMobile: boolean,
  fps: number
): number => {
  const thresholds = isMobile || fps < PERFORMANCE.LOW_FPS_THRESHOLD
    ? PERFORMANCE.LOD_MOBILE
    : PERFORMANCE.LOD_DESKTOP;

  if (distance > thresholds.MEDIUM_DETAIL) return 2; // Low detail
  if (distance > thresholds.HIGH_DETAIL) return 1;  // Medium detail
  return 0; // High detail
};

/**
 * Apply scale based on LOD level
 */
export const getLODScale = (baseScale: number, lodLevel: number): number => {
  switch (lodLevel) {
    case 2: return baseScale * 0.8; // Low detail
    case 1: return baseScale * 0.9; // Medium detail
    default: return baseScale; // High detail
  }
};

/**
 * Format percentage with rounding
 */
export const formatPercentage = (value: number): number => {
  return Math.round(value);
};
