// Shared Design System Constants
// Bold, clean design with purple (interactive) and orange (highlight) accents
// No gradients - solid colors only

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
      purple: 'text-violet-400',
      orange: 'text-orange-400'
    },
    // Solid color system - no gradients
    solid: {
      purple: 'bg-violet-500',
      purpleHover: 'bg-violet-400',
      purpleActive: 'bg-violet-600',
      purpleMuted: 'bg-violet-500/20',
      orange: 'bg-orange-500',
      orangeHover: 'bg-orange-400',
      orangeActive: 'bg-orange-600',
      orangeMuted: 'bg-orange-500/20'
    },
    interactive: {
      primary: 'bg-violet-500',
      hover: 'bg-violet-400',
      active: 'bg-violet-600',
      glow: 'shadow-[0_0_20px_rgba(167,139,250,0.3)]'
    },
    highlight: {
      primary: 'bg-orange-500',
      hover: 'bg-orange-400',
      active: 'bg-orange-600',
      glow: 'shadow-[0_0_20px_rgba(251,146,60,0.3)]'
    },
    border: {
      primary: 'border-white/10',
      secondary: 'border-white/5',
      purple: 'border-violet-500/50',
      orange: 'border-orange-500/50'
    }
  },
  effects: {
    glass: 'backdrop-blur-xl bg-white/5 border border-white/10',
    glassStrong: 'backdrop-blur-2xl bg-white/10 border border-white/20',
    glowPurple: 'shadow-[0_0_20px_rgba(167,139,250,0.3)]',
    glowOrange: 'shadow-[0_0_20px_rgba(251,146,60,0.3)]',
    glowSubtle: 'shadow-[0_0_12px_rgba(167,139,250,0.2)]'
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
export const COMMON_CLASSES = {
  // Button variants - solid colors, no gradients
  button: 'px-4 py-2.5 rounded-sm text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-500/50',

  // Primary button - solid purple (interactive)
  buttonPrimary: 'bg-violet-500 hover:bg-violet-400 active:bg-violet-600 text-white shadow-lg hover:shadow-[0_0_20px_rgba(167,139,250,0.3)] border border-violet-400/20',

  // CTA button - solid orange (highlight/attention)
  buttonCTA: 'bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white shadow-lg hover:shadow-[0_0_20px_rgba(251,146,60,0.3)] border border-orange-400/20',

  // Secondary button - glass effect
  buttonSecondary: 'backdrop-blur-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10',

  // Danger button - solid red
  buttonDanger: 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',

  // Ghost button - minimal
  buttonGhost: 'text-gray-400 hover:text-white hover:bg-white/5',

  // Card/container variants - glassmorphism
  card: 'backdrop-blur-xl rounded-2xl border border-white/10 transition-all duration-200 ease-out bg-white/5',
  cardPurple: 'backdrop-blur-xl rounded-2xl border border-violet-500/20 bg-violet-500/5 shadow-[0_0_20px_rgba(167,139,250,0.1)]',
  cardOrange: 'backdrop-blur-xl rounded-2xl border border-orange-500/20 bg-orange-500/5 shadow-[0_0_20px_rgba(251,146,60,0.1)]',
  cardCollapsed: 'h-12',
  cardExpanded: 'h-auto',

  // Interactive states
  interactive: 'hover:bg-white/10 focus-within:bg-white/10',
  draggable: 'cursor-grab active:cursor-grabbing',
  dragActive: 'scale-105 shadow-2xl ring-2 ring-violet-400/50',

  // Text styles - solid colors
  textPurple: 'text-violet-400',
  textOrange: 'text-orange-400',

  // Input styles
  input: 'backdrop-blur-xl bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200',

  // Z-index layers
  zIndex: {
    base: 'z-50',
    modal: 'z-[60]',
    overlay: 'z-[55]'
  }
} as const;
