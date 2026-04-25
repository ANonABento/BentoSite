/**
 * Playground Design Tokens
 * Retro Arcade / Synthwave design system with CRT aesthetics
 */

export const colors = {
  // Backgrounds - pure black with subtle color hints
  bg: {
    deep: '#0a0a0a',
    surface: '#121212',
    elevated: '#1a1a1a',
    hover: '#242424',
  },

  // Text - slightly warm white for CRT feel
  text: {
    primary: '#f0f0e8',
    secondary: '#a8a8a0',
    muted: '#707070',
    disabled: '#505050',
  },

  // Accent colors - Neon Synthwave palette
  accent: {
    pink: '#ff007f',      // Hot pink (primary)
    pinkHover: '#ff3399',
    cyan: '#00ffff',      // Electric cyan
    cyanHover: '#33ffff',
    purple: '#bf00ff',    // Vivid purple
    purpleHover: '#cc33ff',
    blue: '#0066ff',      // Electric blue
    blueHover: '#3388ff',
  },

  // Game-specific semantic colors
  game: {
    success: '#00ff88',
    successBg: 'rgba(0, 255, 136, 0.15)',
    error: '#ff3366',
    errorBg: 'rgba(255, 51, 102, 0.15)',
    warning: '#ffcc00',
    warningBg: 'rgba(255, 204, 0, 0.15)',
    perfect: '#00ffff',
    perfectBg: 'rgba(0, 255, 255, 0.15)',
  },

  // Gradients - Synthwave style
  gradient: {
    pink: 'linear-gradient(135deg, #ff007f 0%, #ff3399 100%)',
    cyan: 'linear-gradient(135deg, #00ffff 0%, #00cccc 100%)',
    purple: 'linear-gradient(135deg, #bf00ff 0%, #8000aa 100%)',
    blue: 'linear-gradient(135deg, #0066ff 0%, #0044aa 100%)',
    dark: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
    synthwave: 'linear-gradient(180deg, #0a0612 0%, #0a0a0a 50%, #060a0a 100%)',
    neonHorizon: 'linear-gradient(180deg, #ff007f 0%, #bf00ff 50%, #0066ff 100%)',
    radial: 'radial-gradient(ellipse at center, rgba(255, 0, 127, 0.08) 0%, transparent 70%)',
  },

  // Glow effects - Stronger neon glow
  glow: {
    pink: '0 0 20px rgba(255, 0, 127, 0.6), 0 0 40px rgba(255, 0, 127, 0.3)',
    cyan: '0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.3)',
    purple: '0 0 20px rgba(191, 0, 255, 0.6), 0 0 40px rgba(191, 0, 255, 0.3)',
    blue: '0 0 20px rgba(0, 102, 255, 0.6), 0 0 40px rgba(0, 102, 255, 0.3)',
    success: '0 0 20px rgba(0, 255, 136, 0.5)',
    error: '0 0 20px rgba(255, 51, 102, 0.5)',
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
