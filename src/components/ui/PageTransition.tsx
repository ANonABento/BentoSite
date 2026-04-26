'use client';

import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { easings } from '@/lib/animations';
import { ANIMATION_DURATIONS } from '@/lib/constants';
import type { Variants } from 'framer-motion';

const pageVariants: Variants = {
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
};

const reducedPageVariants: Variants = {
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
};

const contentVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATIONS.SLOW / 1000,
      ease: easings.apple,
    },
  },
};

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const variants = prefersReducedMotion ? reducedPageVariants : pageVariants;
  const wrapperClassName = [
    'relative min-h-screen bg-[var(--background)]',
    className,
  ].filter(Boolean).join(' ');

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={pathname}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={wrapperClassName}
        >
          {children}
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
}

export const RouteTransitionProvider = PageTransition;

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
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        variants={prefersReducedMotion ? reducedPageVariants : contentVariants}
        className={className}
        transition={{ delay: prefersReducedMotion ? 0 : delay }}
      >
        {children}
      </m.div>
    </LazyMotion>
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
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isVisible && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : ANIMATION_DURATIONS.NORMAL / 1000,
            }}
            className={className}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
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
  const prefersReducedMotion = useReducedMotion() ?? false;
  const directionOffset = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
  };

  const offset = directionOffset[direction];
  const initialOffset = prefersReducedMotion ? { x: 0, y: 0 } : offset;

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isVisible && (
          <m.div
            initial={{ opacity: 0, ...initialOffset }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...initialOffset }}
            transition={{
              duration: prefersReducedMotion ? 0 : ANIMATION_DURATIONS.SLOW / 1000,
              ease: easings.apple,
            }}
            className={className}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
