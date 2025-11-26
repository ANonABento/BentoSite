// Shared Design System Constants
// Extracted from Dimension.ui.tsx for reusability

export const DESIGN_SYSTEM = {
  spacing: {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  },
  colors: {
    bg: {
      primary: 'bg-gray-900/95',
      secondary: 'bg-gray-800/90',
      tertiary: 'bg-gray-700/80'
    },
    text: {
      primary: 'text-white',
      secondary: 'text-gray-300',
      tertiary: 'text-gray-400'
    },
    interactive: {
      primary: 'bg-blue-600',
      hover: 'bg-blue-500',
      active: 'bg-blue-700'
    },
    border: {
      primary: 'border-gray-600',
      secondary: 'border-gray-700',
      interactive: 'border-blue-500'
    }
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
  // Button variants
  button: 'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50',
  buttonPrimary: 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:ring-blue-400/50',
  buttonSecondary: 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white shadow-md',
  buttonDanger: 'bg-red-600 text-white shadow-lg hover:bg-red-700 focus:ring-red-400/50',
  
  // Card/container variants
  card: 'backdrop-blur-sm rounded-xl border border-opacity-20 transition-all duration-200 ease-out bg-gray-900/95 border-gray-700',
  cardCollapsed: 'h-12',
  cardExpanded: 'h-auto',
  
  // Interactive states
  interactive: 'hover:bg-gray-700/30 focus-within:bg-gray-700/30',
  draggable: 'cursor-grab active:cursor-grabbing',
  dragActive: 'scale-105 shadow-2xl ring-2 ring-blue-400/50',
  
  // Z-index layers
  zIndex: {
    base: 'z-50',
    modal: 'z-[60]',
    overlay: 'z-[55]'
  }
} as const;