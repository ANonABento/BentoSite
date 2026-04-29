'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { ANIMATION } from '../BentoGrid.constants';
import type { CardSize, ThemeConfig } from '../BentoGrid.types';

export interface BaseCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  theme: ThemeConfig;
  size?: CardSize;
  interactive?: boolean;
  entranceIndex?: number;
  isFocused?: boolean;
  isSticky?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function BaseCard({
  children,
  theme,
  size,
  interactive = true,
  entranceIndex = 0,
  isFocused = false,
  isSticky = false,
  className,
  style,
  ...motionProps
}: BaseCardProps) {
  return (
    <motion.div
      data-card-size={size}
      className={[
        'select-none overflow-hidden backdrop-blur-md',
        interactive ? 'cursor-pointer' : '',
        className,
      ].filter(Boolean).join(' ')}
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={interactive && !isSticky ? { scale: ANIMATION.hoverScale } : undefined}
      transition={{
        type: 'spring',
        stiffness: ANIMATION.spring.stiffness,
        damping: ANIMATION.spring.damping,
        delay: entranceIndex * (ANIMATION.stagger / 1000),
      }}
      style={{
        background: isSticky ? theme.searchCard.background : theme.card.background,
        border: isFocused ? `1px solid ${theme.accent.primary}` : (
          isSticky ? theme.searchCard.border : theme.card.border
        ),
        borderRadius: theme.card.borderRadius,
        boxShadow: isFocused || isSticky ? theme.card.hoverShadow : theme.card.shadow,
        ...style,
      }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
