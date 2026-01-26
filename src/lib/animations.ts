import { Variants } from 'framer-motion';

// Standard section entrance - fade up
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// Directional slide variants
export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// Container for staggered children
export const staggerContainer: Variants = {
  hidden: {
    opacity: 1,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Individual stagger item
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// Faster stagger for smaller items (skill pills)
export const staggerFast: Variants = {
  hidden: {
    opacity: 1,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

// Scale and fade item (for skill pills)
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

// Tab content transition
export const tabContent: Variants = {
  initial: {
    opacity: 0,
    x: 10,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

// Button press spring animation config
export const buttonTap = {
  scale: 0.95,
  transition: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  },
};

// Viewport settings for scroll-triggered animations
export const defaultViewport = {
  once: true,
  margin: '-50px',
};
