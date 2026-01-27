// Shared Design System Constants
// Glassmorphism/Futuristic theme for portfolio

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
      accent: 'text-orange-400'
    },
    gradient: {
      primary: 'bg-gradient-to-r from-violet-400 to-purple-500',
      secondary: 'bg-gradient-to-br from-gray-900/80 to-gray-800/60',
      accent: 'bg-gradient-to-r from-orange-500 to-amber-500',
      subtle: 'bg-gradient-to-br from-violet-400/10 to-purple-500/10'
    },
    interactive: {
      primary: 'bg-violet-500',
      hover: 'bg-violet-400',
      active: 'bg-violet-600',
      glow: 'shadow-[0_0_20px_rgba(167,139,250,0.4)]'
    },
    border: {
      primary: 'border-white/10',
      secondary: 'border-white/5',
      interactive: 'border-violet-500/50',
      glow: 'border-orange-500/30'
    }
  },
  effects: {
    glass: 'backdrop-blur-xl bg-white/5 border border-white/10',
    glassStrong: 'backdrop-blur-2xl bg-white/10 border border-white/20',
    glow: 'shadow-[0_0_30px_rgba(167,139,250,0.3)]',
    glowOrange: 'shadow-[0_0_20px_rgba(251,146,60,0.3)]',
    glowSubtle: 'shadow-[0_0_15px_rgba(167,139,250,0.2)]'
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
  // Button variants - updated for glassmorphism
  button: 'px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-500/50',
  buttonPrimary: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg hover:shadow-[0_0_20px_rgba(167,139,250,0.4)] border border-violet-500/20',
  buttonSecondary: 'backdrop-blur-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10',
  buttonDanger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]',
  buttonGhost: 'text-gray-400 hover:text-white hover:bg-white/5',

  // Card/container variants - glassmorphism
  card: 'backdrop-blur-xl rounded-2xl border border-white/10 transition-all duration-200 ease-out bg-white/5',
  cardGlow: 'backdrop-blur-xl rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-400/5 to-purple-500/5 shadow-[0_0_30px_rgba(167,139,250,0.15)]',
  cardCollapsed: 'h-12',
  cardExpanded: 'h-auto',

  // Interactive states
  interactive: 'hover:bg-white/10 focus-within:bg-white/10',
  draggable: 'cursor-grab active:cursor-grabbing',
  dragActive: 'scale-105 shadow-2xl ring-2 ring-violet-400/50',

  // Text styles
  textGradient: 'bg-gradient-to-r from-violet-400 via-purple-400 to-orange-400 bg-clip-text text-transparent',

  // Input styles
  input: 'backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200',
  
  // Z-index layers
  zIndex: {
    base: 'z-50',
    modal: 'z-[60]',
    overlay: 'z-[55]'
  }
} as const;