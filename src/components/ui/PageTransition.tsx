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

const INSTANT_ROUTE_PATHS = new Set(['/projects', '/playground', '/photography']);

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isInstantRoute = INSTANT_ROUTE_PATHS.has(pathname);
  const variants = prefersReducedMotion ? reducedPageTransition : pageTransition;
  const wrapperClassName = [
    'relative min-h-screen bg-[var(--background)]',
    isInstantRoute ? '' : 'will-change-[opacity,transform,filter]',
    className,
  ].filter(Boolean).join(' ');

  if (isInstantRoute) {
    return (
      <div key={pathname} className={wrapperClassName}>
        {children}
      </div>
    );
  }

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
