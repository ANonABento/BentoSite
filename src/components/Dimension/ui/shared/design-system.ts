// Shared Design System Constants
// Bold, clean design with purple (interactive) and orange (highlight) accents
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
      purple: 'text-[var(--purple)]',
      orange: 'text-[var(--orange)]'
    },
    // Solid color system - uses CSS variables for theme support
    solid: {
      purple: 'bg-[var(--purple)]',
      purpleHover: 'bg-[var(--purple-hover)]',
      purpleActive: 'bg-[var(--purple-active)]',
      purpleMuted: 'bg-[var(--purple-muted)]',
      orange: 'bg-[var(--orange)]',
      orangeHover: 'bg-[var(--orange-hover)]',
      orangeActive: 'bg-[var(--orange-active)]',
      orangeMuted: 'bg-[var(--orange-muted)]'
    },
    interactive: {
      primary: 'bg-[var(--purple)]',
      hover: 'bg-[var(--purple-hover)]',
      active: 'bg-[var(--purple-active)]',
      glow: 'shadow-[0_0_20px_var(--purple-muted)]'
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
      purple: 'border-[var(--purple)]',
      orange: 'border-[var(--orange)]'
    }
  },
  effects: {
    glass: 'backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--border)]',
    glassStrong: 'backdrop-blur-2xl bg-[var(--glass-bg-strong)] border border-[var(--border)]',
    glowPurple: 'shadow-[0_0_20px_var(--purple-muted)]',
    glowOrange: 'shadow-[0_0_20px_var(--orange-muted)]',
    glowSubtle: 'shadow-[0_0_12px_var(--purple-muted)]'
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

// Common class combinations for reusability
// All colors use CSS variables for theme support
export const COMMON_CLASSES = {
  // Button variants - solid colors, no gradients
  button: 'px-4 py-2.5 rounded-sm text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--interactive)] focus:ring-opacity-50',

  // Primary button - solid purple (interactive)
  buttonPrimary: 'bg-[var(--purple)] hover:bg-[var(--purple-hover)] active:bg-[var(--purple-active)] text-[var(--text-on-accent)] shadow-lg hover:shadow-[0_0_20px_var(--purple-muted)] border border-[var(--purple-hover)]/20',

  // CTA button - solid orange (highlight/attention)
  buttonCTA: 'bg-[var(--orange)] hover:bg-[var(--orange-hover)] active:bg-[var(--orange-active)] text-[var(--text-on-accent)] shadow-lg hover:shadow-[0_0_20px_var(--orange-muted)] border border-[var(--orange-hover)]/20',

  // Secondary button - glass effect
  buttonSecondary: 'backdrop-blur-xl bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg-strong)] hover:text-[var(--text-primary)] border border-[var(--border)]',

  // Danger button - solid red
  buttonDanger: 'bg-[var(--status-error)] hover:opacity-90 active:opacity-80 text-[var(--text-on-accent)] shadow-lg hover:shadow-[0_0_20px_var(--status-error-muted)]',

  // Ghost button - minimal
  buttonGhost: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]',

  // Card/container variants - glassmorphism
  card: 'backdrop-blur-xl rounded-2xl border border-[var(--border)] transition-all duration-200 ease-out bg-[var(--glass-bg)]',
  cardPurple: 'backdrop-blur-xl rounded-2xl border border-[var(--purple)] border-opacity-20 bg-[var(--purple-muted)] shadow-[0_0_20px_var(--purple-muted)]',
  cardOrange: 'backdrop-blur-xl rounded-2xl border border-[var(--orange)] border-opacity-20 bg-[var(--orange-muted)] shadow-[0_0_20px_var(--orange-muted)]',
  cardCollapsed: 'h-12',
  cardExpanded: 'h-auto',

  // Interactive states
  interactive: 'hover:bg-[var(--glass-bg-strong)] focus-within:bg-[var(--glass-bg-strong)]',
  draggable: 'cursor-grab active:cursor-grabbing',
  dragActive: 'scale-105 shadow-2xl ring-2 ring-[var(--interactive)] ring-opacity-50',

  // Text styles - solid colors using CSS variables
  textPurple: 'text-[var(--purple)]',
  textOrange: 'text-[var(--orange)]',

  // Input styles
  input: 'backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--border)] rounded-sm px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--interactive)] focus:ring-opacity-50 focus:border-[var(--interactive)] transition-all duration-200',

  // Z-index layers
  zIndex: {
    base: 'z-50',
    modal: 'z-[60]',
    overlay: 'z-[55]'
  }
} as const;
