/**
 * Playground - Utility functions
 */

import { REACTION_RATINGS, RHYTHM_CONFIG } from './Playground.config';
import { HitRating } from './Playground.types';

/**
 * Format reaction time in ms
 */
export function formatReactionTime(ms: number): string {
  if (ms < 0) return 'Too early!';
  return `${Math.round(ms)}ms`;
}

/**
 * Get rating for reaction time
 */
export function getReactionRating(ms: number): 'excellent' | 'good' | 'average' | 'slow' {
  if (ms < REACTION_RATINGS.excellent) return 'excellent';
  if (ms < REACTION_RATINGS.good) return 'good';
  if (ms < REACTION_RATINGS.average) return 'average';
  return 'slow';
}

/**
 * Get color for reaction rating
 */
export function getReactionRatingColor(rating: ReturnType<typeof getReactionRating>): string {
  switch (rating) {
    case 'excellent':
      return 'var(--status-success)';
    case 'good':
      return 'var(--purple)';
    case 'average':
      return 'var(--orange)';
    case 'slow':
      return 'var(--status-error)';
  }
}

/**
 * Calculate WPM (Words Per Minute)
 * Standard: 5 characters = 1 word
 */
export function calculateWPM(
  correctChars: number,
  elapsedSeconds: number
): number {
  if (elapsedSeconds === 0) return 0;
  const minutes = elapsedSeconds / 60;
  const words = correctChars / 5;
  return Math.round(words / minutes);
}

/**
 * Calculate typing accuracy percentage
 */
export function calculateAccuracy(
  correctChars: number,
  totalChars: number
): number {
  if (totalChars === 0) return 100;
  return Math.round((correctChars / totalChars) * 100);
}

/**
 * Get hit rating for rhythm game
 */
export function getHitRating(timingOffset: number): HitRating {
  const absOffset = Math.abs(timingOffset);
  if (absOffset <= RHYTHM_CONFIG.timingWindows.perfect) return 'perfect';
  if (absOffset <= RHYTHM_CONFIG.timingWindows.good) return 'good';
  return 'miss';
}

/**
 * Get score for hit rating
 */
export function getHitScore(rating: HitRating, combo: number): number {
  const baseScore = RHYTHM_CONFIG.scoring[rating];
  const comboMultiplier = Math.min(1 + combo * 0.1, 4); // Max 4x multiplier
  return Math.round(baseScore * comboMultiplier);
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Check if new score is a high score
 */
export function isNewHighScore(
  newScore: number,
  currentBest: number | undefined,
  lowerIsBetter: boolean = false
): boolean {
  if (currentBest === undefined) return true;
  return lowerIsBetter ? newScore < currentBest : newScore > currentBest;
}

/**
 * Get ordinal suffix (1st, 2nd, 3rd, etc.)
 */
export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
