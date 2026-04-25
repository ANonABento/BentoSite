/**
 * Theme-specific style utilities
 *
 * Helper functions for generating theme-aware styles.
 */

import type { ThemeConfig, GridTheme } from '../UnifiedGrid.types';

/**
 * Generate CSS variables for a theme
 */
export function getThemeCSSVariables(theme: ThemeConfig): Record<string, string> {
  return {
    '--grid-bg': theme.background,
    '--card-bg': theme.card.background,
    '--card-border': theme.card.border,
    '--card-radius': `${theme.card.borderRadius}px`,
    '--card-shadow': theme.card.shadow,
    '--card-hover-shadow': theme.card.hoverShadow,
    '--accent-primary': theme.accent.primary,
    '--accent-secondary': theme.accent.secondary,
    '--accent-tertiary': theme.accent.tertiary || theme.accent.secondary,
    '--search-bg': theme.searchCard.background,
    '--search-border': theme.searchCard.border,
  };
}

/**
 * Playful theme specific styles
 */
export const playfulStyles = {
  /** Neon glow effect */
  glowEffect: (color: string, intensity: number = 0.3) =>
    `0 0 ${20 * intensity}px ${color}${Math.round(intensity * 100).toString(16).padStart(2, '0')}, 0 0 ${40 * intensity}px ${color}${Math.round(intensity * 50).toString(16).padStart(2, '0')}`,

  /** Scanline overlay */
  scanlines: `repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1) 0px,
    rgba(0, 0, 0, 0.1) 1px,
    transparent 1px,
    transparent 2px
  )`,

  /** Pixel art corner accents */
  pixelCorners: `
    linear-gradient(135deg, #ff00ff 2px, transparent 2px) 0 0,
    linear-gradient(-135deg, #00ffff 2px, transparent 2px) 100% 0,
    linear-gradient(45deg, #ff00ff 2px, transparent 2px) 0 100%,
    linear-gradient(-45deg, #00ffff 2px, transparent 2px) 100% 100%
  `,

  /** CRT curve effect (subtle) */
  crtCurve: 'polygon(2% 0%, 98% 0%, 100% 2%, 100% 98%, 98% 100%, 2% 100%, 0% 98%, 0% 2%)',

  /** Gradient text for titles */
  gradientText: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 50%, #ffff00 100%)',
};

/**
 * Premium theme specific styles
 */
export const premiumStyles = {
  /** Subtle glass effect */
  glassEffect: 'rgba(255, 255, 255, 0.03)',

  /** Premium gradient overlay */
  premiumGradient: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, transparent 50%)',

  /** Subtle border glow on hover */
  hoverGlow: (color: string) =>
    `0 0 0 1px ${color}40, 0 4px 24px rgba(0, 0, 0, 0.4)`,

  /** Clean shadow stack */
  shadowStack: `
    0 1px 2px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.1)
  `,

  /** Subtle gradient text */
  subtleGradientText: 'linear-gradient(180deg, #ffffff 0%, #a0a0a0 100%)',
};

/**
 * Get theme-specific card class names
 */
export function getCardClassName(themeName: GridTheme): string {
  const base = 'transition-all duration-200';

  if (themeName === 'playful') {
    return `${base} hover:scale-[1.02] active:scale-[0.98]`;
  }

  return `${base} hover:translate-y-[-2px]`;
}

/**
 * Generate random tilt for playful theme
 */
export function getRandomTilt(range: number): number {
  if (range === 0) return 0;
  return (Math.random() - 0.5) * 2 * range;
}
