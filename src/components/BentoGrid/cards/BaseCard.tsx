'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { CardPosition, ThemeConfig } from '../BentoGrid.types';
import { ANIMATION } from '../BentoGrid.constants';
import { unifiedGridCardEntranceDelay } from '@/lib/animations';

interface BaseCardProps {
  id: string;
  position: CardPosition;
  theme: ThemeConfig;
  isFocused?: boolean;
  entranceIndex?: number;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

export function BaseCard({
  id,
  position,
  theme,
  isFocused = false,
  entranceIndex = 0,
  className,
  children,
  onClick,
  onHoverStart,
  onHoverEnd,
}: BaseCardProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      layoutId={id}
      className={['absolute cursor-pointer select-none', className].filter(Boolean).join(' ')}
      style={{
        width: position.width,
        height: position.height,
      }}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: position.x,
        y: position.y,
        rotate: position.rotation,
      }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      transition={{
        type: 'spring',
        stiffness: ANIMATION.spring.stiffness,
        damping: ANIMATION.spring.damping,
        delay: prefersReducedMotion ? 0 : unifiedGridCardEntranceDelay(entranceIndex),
      }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.015, y: -2 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      onClick={onClick}
    >
      <div
        className="h-full w-full overflow-hidden transition-all duration-300 ease-out"
        style={{
          background: theme.card.background,
          border: isFocused ? `1px solid ${theme.accent.primary}66` : theme.card.border,
          borderRadius: theme.card.borderRadius,
          boxShadow: isFocused
            ? `0 0 0 3px ${theme.accent.primary}, ${theme.card.hoverShadow}`
            : theme.card.shadow,
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}
