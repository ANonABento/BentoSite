/**
 * Shared utility functions for the application
 * These utilities are reusable across all components
 */

import { BREAKPOINTS, DEFAULTS, PERFORMANCE } from './constants';

// === ID GENERATION ===

/**
 * Generate a unique ID for messages, elements, etc.
 * Combines timestamp with random string for uniqueness
 * @returns A unique string ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// === NUMBER FORMATTING ===

/**
 * Format a number with locale-aware thousand separators
 * @param value - The number to format
 * @returns Formatted string (e.g., "1,234,567")
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Format file size in bytes to human readable format
 * @param bytes - Size in bytes
 * @returns Human readable size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format a percentage value
 * @param value - The percentage value
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format duration in milliseconds to human readable format
 * @param ms - Duration in milliseconds
 * @returns Human readable duration (e.g., "2.5s", "150ms")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// === DEVICE DETECTION ===

/**
 * Check if device is mobile based on various criteria
 * @returns True if device appears to be mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) ||
    window.innerWidth < BREAKPOINTS.MD ||
    'ontouchstart' in window
  );
}

/**
 * Check if we're running on the server (SSR)
 * @returns True if running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if touch is supported
 * @returns True if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// === SCREEN SIZE ===

/**
 * Get screen size with SSR-safe fallback
 * @returns Object with width and height
 */
export function getScreenSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return {
      width: DEFAULTS.WINDOW_WIDTH,
      height: DEFAULTS.WINDOW_HEIGHT,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

// === MATH UTILITIES ===

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param start - Start value
 * @param end - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Map a value from one range to another
 * @param value - Input value
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Mapped value
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// === DEBOUNCE & THROTTLE ===

/**
 * Create a debounced version of a function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Create a throttled version of a function
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// === INPUT DETECTION ===

/**
 * Check if event target is an input element
 * Useful for keyboard shortcut handling
 * @param target - Event target
 * @returns True if target is an input element
 */
export function isInputElement(target: EventTarget): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

// === LOD (LEVEL OF DETAIL) ===

/**
 * Get LOD level based on distance and device performance
 * @param distance - Distance from camera
 * @param isMobile - Whether device is mobile
 * @param fps - Current FPS
 * @returns LOD level (0 = high, 1 = medium, 2 = low)
 */
export function getLODLevel(
  distance: number,
  isMobile: boolean,
  fps: number
): number {
  const thresholds =
    isMobile || fps < PERFORMANCE.LOW_FPS_THRESHOLD
      ? PERFORMANCE.LOD_MOBILE
      : PERFORMANCE.LOD_DESKTOP;

  if (distance > thresholds.MEDIUM_DETAIL) return 2; // Low detail
  if (distance > thresholds.HIGH_DETAIL) return 1; // Medium detail
  return 0; // High detail
}

// === STORAGE UTILITIES ===

/**
 * Safe localStorage get with JSON parsing
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist or parsing fails
 * @returns Parsed value or default
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Safe localStorage set with JSON stringification
 * @param key - Storage key
 * @param value - Value to store
 * @returns True if successful
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove item from localStorage
 * @param key - Storage key
 */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(key);
  } catch {
    // Fail silently
  }
}

// === CLASS NAME UTILITIES ===

/**
 * Conditionally join class names
 * Filters out falsy values
 * @param classes - Class names or conditional class expressions
 * @returns Joined class string
 */
export function cn(
  ...classes: (string | undefined | null | false)[]
): string {
  return classes.filter(Boolean).join(' ');
}
