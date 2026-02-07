/**
 * Playground Animation System
 * Spring physics and Framer Motion variants for premium feel
 */

import { Variants, Transition } from 'framer-motion';

// Spring configurations - physics-based for natural feel
export const springs = {
  // Snappy, responsive - for UI feedback
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },

  // Bouncy - for celebrations, success states
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 15,
  },

  // Gentle - for page transitions
  gentle: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 20,
  },

  // Quick - for micro-interactions
  quick: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
  },
} as const;

// Standard easing curves
export const easings = {
  easeOut: [0.25, 1, 0.5, 1],
  easeOutBack: [0.34, 1.56, 0.64, 1],
  easeInOut: [0.65, 0, 0.35, 1],
  linear: [0, 0, 1, 1],
} as const;

// Transition presets
export const transitions: Record<string, Transition> = {
  fast: { duration: 0.15, ease: easings.easeOut },
  normal: { duration: 0.2, ease: easings.easeOut },
  slow: { duration: 0.3, ease: easings.easeOut },
  bounce: springs.bouncy,
  snap: springs.snappy,
};

// ============================================
// VARIANT DEFINITIONS
// ============================================

// Fade in with slight scale
export const fadeScale: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

// Fade in from below
export const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15 },
  },
};

// Pop in with bounce
export const popIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.1 },
  },
};

// Stagger container for child animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

// Stagger item (child of staggerContainer)
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
};

// Card hover effect
export const cardHover: Variants = {
  initial: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// Button press effect
export const buttonPress: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: springs.quick,
  },
  tap: {
    scale: 0.96,
    transition: { duration: 0.05 },
  },
};

// Pulse animation (for attention)
export const pulse: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: 'reverse',
    },
  },
};

// Shake animation (for errors)
export const shake: Variants = {
  initial: { x: 0 },
  shake: {
    x: [-8, 8, -6, 6, -4, 4, -2, 2, 0],
    transition: { duration: 0.5 },
  },
};

// Countdown number animation
export const countdownNumber: Variants = {
  enter: {
    scale: 0.5,
    opacity: 0,
  },
  center: {
    scale: 1,
    opacity: 1,
    transition: springs.bouncy,
  },
  exit: {
    scale: 1.5,
    opacity: 0,
    transition: { duration: 0.3, ease: easings.easeOut },
  },
};

// Score reveal (dramatic entrance)
export const scoreReveal: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
    y: 30,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...springs.bouncy,
      delay: 0.2,
    },
  },
};

// Glow pulse (for active states)
export const glowPulse = (color: string): Variants => ({
  initial: {
    boxShadow: `0 0 0px ${color}`,
  },
  glow: {
    boxShadow: [
      `0 0 10px ${color}`,
      `0 0 25px ${color}`,
      `0 0 10px ${color}`,
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
});

// Progress ring animation
export const progressRing = (progress: number): Variants => ({
  initial: {
    pathLength: 0,
  },
  animate: {
    pathLength: progress,
    transition: {
      duration: 0.5,
      ease: easings.easeOut,
    },
  },
});

// Slide in from direction
export const slideIn = (direction: 'left' | 'right' | 'up' | 'down'): Variants => {
  const offset = 50;
  const directions = {
    left: { x: -offset, y: 0 },
    right: { x: offset, y: 0 },
    up: { x: 0, y: -offset },
    down: { x: 0, y: offset },
  };

  return {
    hidden: {
      opacity: 0,
      ...directions[direction],
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: springs.gentle,
    },
    exit: {
      opacity: 0,
      ...directions[direction],
      transition: { duration: 0.15 },
    },
  };
};

// Celebration burst (for high scores)
export const celebration: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
    rotate: -180,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      ...springs.bouncy,
      delay: 0.3,
    },
  },
};

// Export all animations
export const animations = {
  springs,
  easings,
  transitions,
  variants: {
    fadeScale,
    fadeUp,
    popIn,
    staggerContainer,
    staggerItem,
    cardHover,
    buttonPress,
    pulse,
    shake,
    countdownNumber,
    scoreReveal,
    glowPulse,
    progressRing,
    slideIn,
    celebration,
  },
} as const;

export default animations;
