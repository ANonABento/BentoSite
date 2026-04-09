/**
 * Unified Design Tokens
 *
 * Central source of truth for all design values in the application.
 * Uses CSS variables from globals.css for theme support.
 *
 * Import this file for:
 * - Consistent spacing, colors, typography across components
 * - Type-safe access to design values
 * - Easy theming and maintenance
 */

// === COLORS ===

/**
 * Color tokens using CSS variables for theme support
 * Use these with Tailwind's arbitrary value syntax: bg-[var(--purple)]
 */
export const colors = {
  // Primary brand colors
  brand: {
    purple: 'var(--purple)',
    purpleHover: 'var(--purple-hover)',
    purpleActive: 'var(--purple-active)',
    purpleMuted: 'var(--purple-muted)',
    orange: 'var(--orange)',
    orangeHover: 'var(--orange-hover)',
    orangeActive: 'var(--orange-active)',
    orangeMuted: 'var(--orange-muted)',
  },

  // Text colors
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    disabled: 'var(--text-disabled)',
  },

  // Background colors
  bg: {
    primary: 'var(--bg-primary)',
    secondary: 'var(--bg-secondary)',
    elevated: 'var(--bg-elevated)',
    glass: 'var(--glass-bg)',
  },

  // Border colors
  border: {
    default: 'var(--border)',
    subtle: 'rgba(255, 255, 255, 0.05)',
    light: 'rgba(255, 255, 255, 0.1)',
    strong: 'rgba(255, 255, 255, 0.2)',
  },

  // Status colors
  status: {
    success: 'var(--status-success)',
    successMuted: 'var(--status-success-muted)',
    error: 'var(--status-error)',
    errorMuted: 'var(--status-error-muted)',
    warning: 'var(--status-warning)',
    warningMuted: 'var(--status-warning-muted)',
    info: 'var(--status-info)',
    infoMuted: 'var(--status-info-muted)',
  },

  // Game-specific colors (for Playground)
  game: {
    perfect: '#22d3ee',
    perfectBg: 'rgba(34, 211, 238, 0.15)',
    gold: '#fbbf24',
    goldBg: 'rgba(251, 191, 36, 0.15)',
    rose: '#fb7185',
    roseBg: 'rgba(251, 113, 133, 0.15)',
  },
} as const;

// === SPACING ===

/**
 * Spacing scale (matches Tailwind defaults)
 */
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
} as const;

// === TYPOGRAPHY ===

/**
 * Typography tokens for consistent text styling
 */
export const typography = {
  // Font families
  family: {
    sans: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
  },

  // Font sizes with line heights
  size: {
    xs: { fontSize: '0.75rem', lineHeight: '1rem' },
    sm: { fontSize: '0.875rem', lineHeight: '1.25rem' },
    base: { fontSize: '1rem', lineHeight: '1.5rem' },
    lg: { fontSize: '1.125rem', lineHeight: '1.75rem' },
    xl: { fontSize: '1.25rem', lineHeight: '1.75rem' },
    '2xl': { fontSize: '1.5rem', lineHeight: '2rem' },
    '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem' },
    '4xl': { fontSize: '2.25rem', lineHeight: '2.5rem' },
  },

  // Font weights
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Hero/display text for scores, headings
  display: {
    hero: {
      fontSize: 'clamp(4rem, 12vw, 8rem)',
      fontWeight: '700',
      letterSpacing: '-0.02em',
      lineHeight: '1',
    },
    large: {
      fontSize: 'clamp(2.5rem, 8vw, 4rem)',
      fontWeight: '700',
      letterSpacing: '-0.01em',
      lineHeight: '1.1',
    },
  },
} as const;

// === RADIUS ===

/**
 * Border radius tokens
 */
export const radius = {
  none: '0',
  sm: '0.125rem', // 2px - for sharp corners
  DEFAULT: '0.25rem', // 4px - default rounded
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px', // fully rounded (circles, pills)
} as const;

// === SHADOWS ===

/**
 * Shadow tokens
 */
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

  // Glow effects
  glow: {
    purple: '0 0 20px var(--purple-muted)',
    orange: '0 0 20px var(--orange-muted)',
    success: '0 0 20px var(--status-success-muted)',
    error: '0 0 20px var(--status-error-muted)',
  },
} as const;

// === TIMING ===

/**
 * Animation timing tokens (in milliseconds)
 */
export const timing = {
  instant: 0,
  fast: 150,
  normal: 200,
  slow: 300,
  dramatic: 500,
} as const;

// === Z-INDEX ===

/**
 * Z-index scale for layering
 */
export const zIndex = {
  base: 0,
  elevated: 10,
  dropdown: 20,
  sticky: 30,
  fixed: 40,
  overlay: 50,
  modal: 60,
  popover: 70,
  tooltip: 80,
  toast: 90,
} as const;

// === BREAKPOINTS ===

/**
 * Responsive breakpoints (matches Tailwind)
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// === COMMON TAILWIND CLASS PATTERNS ===

/**
 * Pre-composed Tailwind class strings for common patterns
 * Use these for consistency across components
 */
export const classes = {
  // Glass morphism effect
  glass: 'glass',
  glassStrong: 'glass-strong',

  // Button base
  buttonBase:
    'px-4 py-2.5 rounded-sm text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2',

  // Button variants
  buttonPrimary:
    'bg-[var(--purple)] hover:bg-[var(--purple-hover)] active:bg-[var(--purple-active)] text-white hover:shadow-[0_0_20px_var(--purple-muted)]',
  buttonCTA:
    'bg-[var(--orange)] hover:bg-[var(--orange-hover)] active:bg-[var(--orange-active)] text-white hover:shadow-[0_0_20px_var(--orange-muted)]',
  buttonSecondary:
    'glass text-[var(--text-secondary)] hover:bg-[var(--glass-bg-strong)] hover:text-[var(--text-primary)] border border-[var(--border)]',
  buttonGhost:
    'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]',
  buttonDanger:
    'bg-[var(--status-error)] hover:opacity-90 active:opacity-80 text-[var(--text-on-accent)]',

  // Input
  input:
    'glass rounded-sm px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/50 focus:border-[var(--purple)]/50 transition-all duration-200',

  // Card
  card: 'glass rounded-2xl',
  cardInteractive:
    'glass rounded-2xl hover:bg-[var(--glass-bg-strong)] transition-all duration-200',

  // Text
  textPrimary: 'text-[var(--text-primary)]',
  textSecondary: 'text-[var(--text-secondary)]',
  textMuted: 'text-[var(--text-muted)]',
} as const;

// === EXPORT ALL ===

export const tokens = {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  timing,
  zIndex,
  breakpoints,
  classes,
} as const;

export default tokens;
