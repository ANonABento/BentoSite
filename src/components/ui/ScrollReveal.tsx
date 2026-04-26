'use client';

import type { ReactNode } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import {
  defaultViewport,
  reducedScrollReveal,
  scrollReveal,
} from '@/lib/animations';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  id,
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <m.div
      id={id}
      className={className}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={prefersReducedMotion ? reducedScrollReveal : scrollReveal}
    >
      {children}
    </m.div>
  );
}
