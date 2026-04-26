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
