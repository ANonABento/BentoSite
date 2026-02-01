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
      primary: 'bg-gray-900/80',
      secondary: 'bg-gray-800/60',
      tertiary: 'bg-gray-700/50',
      glass: 'bg-white/5',
      glassStrong: 'bg-white/10'
    },
    text: {
      primary: 'text-white',
      secondary: 'text-gray-300',
      tertiary: 'text-gray-400',
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
      primary: 'border-white/10',
      secondary: 'border-white/5',
      purple: 'border-[var(--purple)]/50',
      orange: 'border-[var(--orange)]/50'
    }
  },
  effects: {
    glass: 'backdrop-blur-xl bg-white/5 border border-white/10',
    glassStrong: 'backdrop-blur-2xl bg-white/10 border border-white/20',
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
  button: 'px-4 py-2.5 rounded-sm text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/50',

  // Primary button - solid purple (interactive)
  buttonPrimary: 'bg-[var(--purple)] hover:bg-[var(--purple-hover)] active:bg-[var(--purple-active)] text-white shadow-lg hover:shadow-[0_0_20px_var(--purple-muted)] border border-[var(--purple-hover)]/20',

  // CTA button - solid orange (highlight/attention)
  buttonCTA: 'bg-[var(--orange)] hover:bg-[var(--orange-hover)] active:bg-[var(--orange-active)] text-white shadow-lg hover:shadow-[0_0_20px_var(--orange-muted)] border border-[var(--orange-hover)]/20',

  // Secondary button - glass effect
  buttonSecondary: 'backdrop-blur-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10',

  // Danger button - solid red
  buttonDanger: 'bg-[var(--status-error)] hover:bg-red-500 active:bg-red-700 text-white shadow-lg hover:shadow-[0_0_20px_var(--status-error-muted)]',

  // Ghost button - minimal
  buttonGhost: 'text-gray-400 hover:text-white hover:bg-white/5',

  // Card/container variants - glassmorphism
  card: 'backdrop-blur-xl rounded-2xl border border-white/10 transition-all duration-200 ease-out bg-white/5',
  cardPurple: 'backdrop-blur-xl rounded-2xl border border-[var(--purple)]/20 bg-[var(--purple)]/5 shadow-[0_0_20px_var(--purple-muted)]',
  cardOrange: 'backdrop-blur-xl rounded-2xl border border-[var(--orange)]/20 bg-[var(--orange)]/5 shadow-[0_0_20px_var(--orange-muted)]',
  cardCollapsed: 'h-12',
  cardExpanded: 'h-auto',

  // Interactive states
  interactive: 'hover:bg-white/10 focus-within:bg-white/10',
  draggable: 'cursor-grab active:cursor-grabbing',
  dragActive: 'scale-105 shadow-2xl ring-2 ring-[var(--purple)]/50',

  // Text styles - solid colors using CSS variables
  textPurple: 'text-[var(--purple)]',
  textOrange: 'text-[var(--orange)]',

  // Input styles
  input: 'backdrop-blur-xl bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--purple)]/50 focus:border-[var(--purple)]/50 transition-all duration-200',

  // Z-index layers
  zIndex: {
    base: 'z-50',
    modal: 'z-[60]',
    overlay: 'z-[55]'
  }
} as const;
