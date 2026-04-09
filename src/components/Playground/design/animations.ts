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
  },
} as const;

export default animations;
