import type { Transition, Variants } from 'framer-motion';
import { ANIMATION_DURATIONS } from './constants';

// Premium easing curves
export const easings = {
  // Smooth deceleration - great for entrances
  easeOutQuart: [0.25, 1, 0.5, 1] as const,
  // Gentle acceleration then deceleration
  easeInOutQuart: [0.76, 0, 0.24, 1] as const,
  // Snappy spring-like feel
  easeOutBack: [0.34, 1.56, 0.64, 1] as const,
  // Smooth and premium
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  // Apple-style smooth
  apple: [0.25, 0.46, 0.45, 0.94] as const,
};

// Smooth reveal with blur - premium entrance effect
export const smoothReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.7,
      ease: easings.apple,
    },
  },
};

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
      ease: easings.easeOutQuart,
    },
  },
};

// Directional slide variants
export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: easings.easeOutQuart,
    },
  },
};

export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: easings.easeOutQuart,
    },
  },
};

// Container for staggered children - enhanced timing
export const staggerContainer: Variants = {
  hidden: {
    opacity: 1,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

// Individual stagger item with better motion
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 15,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easings.easeOutQuart,
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
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

// Scale and fade item (for skill pills)
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: easings.easeOutBack,
    },
  },
};

// Pop in with slight overshoot
export const popIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
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
      duration: 0.25,
      ease: easings.easeOutQuart,
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

// Route-level page transition for App Router navigation
export const pageTransition = {
  initial: {
    opacity: 0,
    y: 12,
    filter: 'blur(6px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: ANIMATION_DURATIONS.SLOW / 1000,
      ease: easings.apple,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
    transition: {
      duration: ANIMATION_DURATIONS.NORMAL / 1000,
      ease: easings.easeOutQuart,
    },
  },
} satisfies Variants;

// Reduced-motion route transition keeps context changes perceptible without movement
export const reducedPageTransition = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATIONS.INSTANT,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATIONS.INSTANT,
    },
  },
} satisfies Variants;

// Card hover with 3D tilt effect
export const cardHover = {
  rest: {
    scale: 1,
    rotateX: 0,
    rotateY: 0,
    transition: {
      duration: 0.3,
      ease: easings.easeOutQuart,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: easings.easeOutQuart,
    },
  },
};

// Glow pulse animation for attention
export const glowPulse: Variants = {
  initial: {
    boxShadow: '0 0 0 rgba(167, 139, 250, 0)',
  },
  animate: {
    boxShadow: [
      '0 0 0 rgba(167, 139, 250, 0)',
      '0 0 20px rgba(167, 139, 250, 0.4)',
      '0 0 0 rgba(167, 139, 250, 0)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Skeleton loading pulse
export const skeletonPulse: Variants = {
  initial: {
    opacity: 0.4,
  },
  animate: {
    opacity: [0.4, 0.7, 0.4],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
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

// Enhanced button hover
export const buttonHover = {
  scale: 1.02,
  transition: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
  },
};

// Floating animation for decorative elements
export const float: Variants = {
  initial: {
    y: 0,
  },
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Viewport settings for scroll-triggered animations
export const defaultViewport = {
  once: true,
  margin: '-80px',
};

// Viewport for elements that should animate earlier
export const earlyViewport = {
  once: true,
  margin: '-20px',
};

// Spring transition presets
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

export const snappySpring: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};

export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
};

// Page section stagger - for main page sections
export const sectionStagger: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

// Panel entrance — OS window appearing (bentOS dashboard)
export const panelReveal: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: easings.easeOutQuart,
    },
  },
};

// Ambient breathing for status indicators
export const breathe: Variants = {
  initial: {
    opacity: 0.4,
  },
  animate: {
    opacity: [0.4, 0.7, 0.4],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Section item with blur reveal
export const sectionItem: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: easings.apple,
    },
  },
};

// Viewport section reveal for whole-page scroll surfaces.
export const scrollReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
    filter: 'blur(8px)',
  },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      delay,
      ease: easings.apple,
    },
  }),
};

export const reducedScrollReveal: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: {
      duration: ANIMATION_DURATIONS.NORMAL / 1000,
      delay,
      ease: easings.easeOutQuart,
    },
  }),
};

// Bento hub cards enter as a soft cascade while preserving their physics springs.
export const bentoCardEntrance: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
  },
  visible: (index = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.42,
      delay: index * 0.045,
      ease: easings.easeOutExpo,
    },
  }),
};

export const bentoSlotReveal: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
  },
  visible: (index = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      delay: index * 0.035,
      ease: easings.easeOutQuart,
    },
  }),
};

export const unifiedGridCardEntranceDelay = (index = 0) => Math.min(index, 8) * 0.025;

// Dashboard entrance — first-load reveal after boot.
//
// Each panel slides in from its docked side with an explicit delay baked in,
// so the sequence reads as "OS chrome assembling" rather than a mechanical
// simultaneous fade. Order: header → 3D viewer → terminal → skills.
//
// No scale/filter transforms — these create a new backdrop-root and break
// backdrop-filter: blur() on .glass-panel descendants.
const DASHBOARD_DURATION = 0.65;
const DASHBOARD_TRANSLATE = 48;
const DASHBOARD_DELAYS = {
  header: 0,
  left: 0.12,
  bottom: 0.22,
  right: 0.32,
} as const;

const dashboardTransition = (delay: number): Transition => ({
  duration: DASHBOARD_DURATION,
  ease: easings.easeOutQuart,
  delay,
});

// Header — drops from above.
export const dashboardHeaderIn: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: dashboardTransition(DASHBOARD_DELAYS.header) },
};

// 3D viewer — slides in from the left.
export const dashboardLeftIn: Variants = {
  hidden: { opacity: 0, x: -DASHBOARD_TRANSLATE },
  visible: { opacity: 1, x: 0, transition: dashboardTransition(DASHBOARD_DELAYS.left) },
};

// Terminal — rises from below.
export const dashboardBottomIn: Variants = {
  hidden: { opacity: 0, y: DASHBOARD_TRANSLATE },
  visible: { opacity: 1, y: 0, transition: dashboardTransition(DASHBOARD_DELAYS.bottom) },
};

// Skills column — slides in from the right.
export const dashboardRightIn: Variants = {
  hidden: { opacity: 0, x: DASHBOARD_TRANSLATE },
  visible: { opacity: 1, x: 0, transition: dashboardTransition(DASHBOARD_DELAYS.right) },
};

// Generic fallback (mobile tabs, mobile viewfinder) — modest fade-up.
export const dashboardPanelIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easings.easeOutQuart },
  },
};

// Orchestrator — propagates `hidden`/`visible` labels to children via variant
// inheritance. No `staggerChildren`; each child encodes its own delay above.
export const dashboardStagger: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};
