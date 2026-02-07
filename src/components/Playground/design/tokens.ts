/**
 * Playground Design Tokens
 * Modern, minimalist design system inspired by Human Benchmark & Monkeytype
 */

export const colors = {
  // Backgrounds - near-black with subtle blue undertones
  bg: {
    deep: '#050612',
    surface: '#0c0c14',
    elevated: '#141420',
    hover: '#1a1a28',
  },

  // Text - off-white to reduce eye strain
  text: {
    primary: '#e8e6e3',
    secondary: '#a1a1aa',
    muted: '#71717a',
    disabled: '#52525b',
  },

  // Accent colors - vibrant but not garish
  accent: {
    gold: '#fbbf24',
    goldHover: '#f59e0b',
    cyan: '#22d3ee',
    cyanHover: '#06b6d4',
    rose: '#fb7185',
    roseHover: '#f43f5e',
    purple: '#a78bfa',
    purpleHover: '#8b5cf6',
  },

  // Game-specific semantic colors
  game: {
    success: '#4ade80',
    successBg: 'rgba(74, 222, 128, 0.15)',
    error: '#f87171',
    errorBg: 'rgba(248, 113, 113, 0.15)',
    warning: '#fbbf24',
    warningBg: 'rgba(251, 191, 36, 0.15)',
    perfect: '#22d3ee',
    perfectBg: 'rgba(34, 211, 238, 0.15)',
  },

  // Gradients
  gradient: {
    gold: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    cyan: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
    purple: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    rose: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)',
    dark: 'linear-gradient(180deg, #0c0c14 0%, #050612 100%)',
    radial: 'radial-gradient(ellipse at center, rgba(167, 139, 250, 0.08) 0%, transparent 70%)',
  },

  // Glow effects
  glow: {
    gold: '0 0 20px rgba(251, 191, 36, 0.4)',
    cyan: '0 0 20px rgba(34, 211, 238, 0.4)',
    purple: '0 0 20px rgba(167, 139, 250, 0.4)',
    success: '0 0 20px rgba(74, 222, 128, 0.4)',
    error: '0 0 20px rgba(248, 113, 113, 0.4)',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

export const typography = {
  // Score display - large, bold, monospace
  score: {
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
    medium: {
      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
      fontWeight: '600',
      letterSpacing: '0',
      lineHeight: '1.2',
    },
  },

  // Body text
  body: {
    large: {
      fontSize: '1.125rem',
      fontWeight: '400',
      lineHeight: '1.6',
    },
    base: {
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    small: {
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.5',
    },
  },

  // Labels
  label: {
    large: {
      fontSize: '0.875rem',
      fontWeight: '500',
      letterSpacing: '0.025em',
      textTransform: 'uppercase' as const,
    },
    small: {
      fontSize: '0.75rem',
      fontWeight: '500',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
    },
  },
} as const;

export const radius = {
  sm: '6px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
  md: '0 4px 16px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
  glow: (color: string) => `0 0 30px ${color}`,
} as const;

export const borders = {
  subtle: '1px solid rgba(255, 255, 255, 0.06)',
  light: '1px solid rgba(255, 255, 255, 0.1)',
  accent: (color: string) => `2px solid ${color}`,
} as const;

// Timing functions
export const timing = {
  instant: 0,
  fast: 150,
  normal: 200,
  slow: 300,
  dramatic: 500,
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  elevated: 10,
  overlay: 50,
  modal: 100,
  toast: 150,
} as const;

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;

// Export as single object for convenience
export const tokens = {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  borders,
  timing,
  zIndex,
  breakpoints,
} as const;

export default tokens;
