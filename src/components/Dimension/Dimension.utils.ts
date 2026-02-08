// Dimension.tsx - Utility Functions

import * as THREE from 'three';

/**
 * Format file size in bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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
 * Check if device is mobile based on various criteria
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth < 768 ||
         ('ontouchstart' in window);
};

/**
 * Get screen size with fallback
 */
export const getScreenSize = () => {
  if (typeof window === 'undefined') {
    return { width: 1920, height: 1080 };
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
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
 */
export const getLODLevel = (
  distance: number,
  isMobile: boolean,
  fps: number
): number => {
  if (isMobile || fps < 30) {
    // Lower LOD for mobile or low performance
    if (distance > 10) return 2; // Low detail
    if (distance > 5) return 1;  // Medium detail
    return 0; // High detail
  } else {
    // Higher LOD for desktop with good performance
    if (distance > 20) return 2; // Low detail
    if (distance > 10) return 1; // Medium detail
    return 0; // High detail
  }
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
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Check if element is input field (for keyboard shortcuts)
 */
export const isInputElement = (target: EventTarget): boolean => {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
};

/**
 * Format vertex count with commas
 */
export const formatVertexCount = (count: number): string => {
  return count.toLocaleString();
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Get appropriate damping factor for mobile vs desktop
 */
export const getDampingFactor = (isMobile: boolean): number => {
  return isMobile ? 0.1 : 0.05;
};

/**
 * Get appropriate zoom limits for mobile vs desktop
 */
export const getZoomLimits = (isMobile: boolean) => {
  return {
    minDistance: isMobile ? 4 : 3,
    maxDistance: isMobile ? 40 : 30,
  };
};

/**
 * Format percentage with rounding
 */
export const formatPercentage = (value: number): number => {
  return Math.round(value);
};
