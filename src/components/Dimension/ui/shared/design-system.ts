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
      accent: 'text-cyan-400'
    },
    gradient: {
      primary: 'bg-gradient-to-r from-indigo-500 to-violet-500',
      secondary: 'bg-gradient-to-br from-gray-900/80 to-gray-800/60',
      accent: 'bg-gradient-to-r from-cyan-500 to-blue-500',
      subtle: 'bg-gradient-to-br from-indigo-500/10 to-violet-500/10'
    },
    interactive: {
      primary: 'bg-indigo-600',
      hover: 'bg-indigo-500',
      active: 'bg-indigo-700',
      glow: 'shadow-[0_0_20px_rgba(99,102,241,0.4)]'
    },
    border: {
      primary: 'border-white/10',
      secondary: 'border-white/5',
      interactive: 'border-indigo-500/50',
      glow: 'border-cyan-500/30'
    }
  },
  effects: {
    glass: 'backdrop-blur-xl bg-white/5 border border-white/10',
    glassStrong: 'backdrop-blur-2xl bg-white/10 border border-white/20',
    glow: 'shadow-[0_0_30px_rgba(99,102,241,0.3)]',
    glowCyan: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
    glowSubtle: 'shadow-[0_0_15px_rgba(99,102,241,0.2)]'
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
  button: 'px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
  buttonPrimary: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-500/20',
  buttonSecondary: 'backdrop-blur-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10',
  buttonDanger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]',
  buttonGhost: 'text-gray-400 hover:text-white hover:bg-white/5',
  
  // Card/container variants - glassmorphism
  card: 'backdrop-blur-xl rounded-2xl border border-white/10 transition-all duration-200 ease-out bg-white/5',
  cardGlow: 'backdrop-blur-xl rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 shadow-[0_0_30px_rgba(99,102,241,0.15)]',
  cardCollapsed: 'h-12',
  cardExpanded: 'h-auto',
  
  // Interactive states
  interactive: 'hover:bg-white/10 focus-within:bg-white/10',
  draggable: 'cursor-grab active:cursor-grabbing',
  dragActive: 'scale-105 shadow-2xl ring-2 ring-indigo-400/50',
  
  // Text styles
  textGradient: 'bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent',
  
  // Input styles
  input: 'backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200',
  
  // Z-index layers
  zIndex: {
    base: 'z-50',
    modal: 'z-[60]',
    overlay: 'z-[55]'
  }
} as const;