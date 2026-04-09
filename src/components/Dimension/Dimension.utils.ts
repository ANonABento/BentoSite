// Dimension.tsx - Utility Functions

import * as THREE from 'three';
import {
  formatFileSize as sharedFormatFileSize,
  formatNumber,
  isMobileDevice as sharedIsMobileDevice,
  getScreenSize as sharedGetScreenSize,
  clamp as sharedClamp,
  debounce as sharedDebounce,
  isInputElement as sharedIsInputElement,
} from '@/lib/utils';
import { PERFORMANCE, ZOOM_LIMITS } from '@/lib/constants';

// Re-export shared utilities for backwards compatibility
export const formatFileSize = sharedFormatFileSize;
export const isMobileDevice = sharedIsMobileDevice;
export const getScreenSize = sharedGetScreenSize;
export const clamp = sharedClamp;
export const debounce = sharedDebounce;
export const isInputElement = sharedIsInputElement;

/**
 * Format vertex count with commas
 */
export const formatVertexCount = formatNumber;

/**
 * Get CSS class for category color
 */
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Basic': 'bg-[var(--status-info-muted)] text-[var(--status-info)]',
    'Furniture': 'bg-[var(--status-success-muted)] text-[var(--status-success)]',
    'Decorative': 'bg-[var(--purple-muted)] text-[var(--purple)]',
    'Architecture': 'bg-[var(--status-warning-muted)] text-[var(--status-warning)]',
    'Art': 'bg-[var(--status-error-muted)] text-[var(--status-error)]'
  };
  return colors[category] || 'bg-[var(--glass-bg)] text-[var(--text-secondary)]';
};

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
 * Get appropriate damping factor for mobile vs desktop
 */
export const getDampingFactor = (isMobile: boolean): number => {
  return isMobile ? 0.1 : 0.05;
};

/**
 * Get appropriate zoom limits for mobile vs desktop
 * Uses centralized zoom limit constants
 */
export const getZoomLimits = (isMobile: boolean) => {
  return isMobile ? ZOOM_LIMITS.MOBILE : ZOOM_LIMITS.DESKTOP;
};

/**
 * Format percentage with rounding
 */
export const formatPercentage = (value: number): number => {
  return Math.round(value);
};
