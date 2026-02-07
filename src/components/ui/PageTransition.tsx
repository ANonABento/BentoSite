'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

// Page transition variants
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94], // Apple-style easing
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

// Content stagger variants for child elements
const contentVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageTransition - Smooth page transition wrapper
 * 
 * Wraps page content with smooth fade/slide animations when navigating.
 * Uses AnimatePresence for exit animations and Framer Motion for enter animations.
 * 
 * Usage:
 * ```tsx
 * <PageTransition>
 *   <YourPageContent />
 * </PageTransition>
 * ```
 */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * PageTransitionItem - Individual element that animates within a page transition
 * 
 * Use this for child elements that should stagger animate when the page loads.
 * Must be used inside a PageTransition component.
 */
export function PageTransitionItem({ 
  children, 
  className = '',
  delay = 0,
}: { 
  children: ReactNode; 
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={contentVariants}
      className={className}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * FadeTransition - Simple fade transition without movement
 * 
 * Good for modals, panels, and overlays.
 */
export function FadeTransition({ 
  children, 
  className = '',
  isVisible = true,
}: { 
  children: ReactNode; 
  className?: string;
  isVisible?: boolean;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * SlideTransition - Slide in from a specific direction
 */
export function SlideTransition({ 
  children, 
  className = '',
  direction = 'up',
  isVisible = true,
}: { 
  children: ReactNode; 
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  isVisible?: boolean;
}) {
  const directionOffset = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
  };

  const offset = directionOffset[direction];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, ...offset }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, ...offset }}
          transition={{ 
            duration: 0.3, 
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
