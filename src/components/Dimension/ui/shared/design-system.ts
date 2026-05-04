// Shared Design System Constants
// Bold, clean design with semantic primary accents
// No gradients - solid colors only
// All colors use CSS variables from globals.css for theme support

export const DESIGN_SYSTEM = {
  spacing: {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  },
  colors: {
    bg: {
      primary: 'bg-[var(--overlay-strong)]',
      secondary: 'bg-[var(--overlay)]',
      tertiary: 'bg-[var(--overlay-weak)]',
      glass: 'bg-[var(--glass-bg)]',
      glassStrong: 'bg-[var(--glass-bg-strong)]'
    },
    text: {
      primary: 'text-[var(--text-primary)]',
      secondary: 'text-[var(--text-secondary)]',
      tertiary: 'text-[var(--text-muted)]',
      primaryAccent: 'text-[var(--primary)]',
      orange: 'text-[var(--orange)]'
    },
    // Solid color system - uses CSS variables for theme support
    solid: {
      primaryAccent: 'bg-[var(--primary)]',
      primaryAccentHover: 'bg-[var(--primary-hover)]',
      primaryAccentActive: 'bg-[var(--primary-active)]',
      primaryAccentMuted: 'bg-[var(--primary-muted)]',
      orange: 'bg-[var(--orange)]',
      orangeHover: 'bg-[var(--orange-hover)]',
      orangeActive: 'bg-[var(--orange-active)]',
      orangeMuted: 'bg-[var(--orange-muted)]'
    },
    interactive: {
      primary: 'bg-[var(--primary)]',
      hover: 'bg-[var(--primary-hover)]',
      active: 'bg-[var(--primary-active)]',
      glow: 'shadow-[0_0_20px_var(--primary-muted)]'
    },
    highlight: {
      primary: 'bg-[var(--orange)]',
      hover: 'bg-[var(--orange-hover)]',
      active: 'bg-[var(--orange-active)]',
      glow: 'shadow-[0_0_20px_var(--orange-muted)]'
    },
    border: {
      primary: 'border-[var(--border)]',
      secondary: 'border-[var(--border)]',
      primaryAccent: 'border-[var(--primary)]',
      orange: 'border-[var(--orange)]'
    }
  },
  effects: {
    glass: 'backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--border)]',
    glassStrong: 'backdrop-blur-2xl bg-[var(--glass-bg-strong)] border border-[var(--border)]',
    glowPrimary: 'shadow-[0_0_20px_var(--primary-muted)]',
    glowOrange: 'shadow-[0_0_20px_var(--orange-muted)]',
    glowSubtle: 'shadow-[0_0_12px_var(--primary-muted)]'
  },
  animations: {
    duration: {
      fast: 'duration-150',
      normal: 'duration-200',
      slow: 'duration-300'
    },
    easing: {
      ease: 'ease-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  }
} as const;
