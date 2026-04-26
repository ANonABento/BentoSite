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
import { pageTransition, reducedPageTransition } from '@/lib/animations';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const variants = prefersReducedMotion ? reducedPageTransition : pageTransition;
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
