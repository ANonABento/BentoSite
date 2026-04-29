'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { unifiedGridCardEntranceDelay } from '@/lib/animations';
import { ANIMATION } from '../BentoGrid.constants';
import type { CardPosition, ThemeConfig } from '../BentoGrid.types';

export interface BaseCardProps {
  position: CardPosition;
  theme: ThemeConfig;
  children: ReactNode;
  onClick?: () => void;
  isFocused?: boolean;
  entranceIndex?: number;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
  contentStyle?: CSSProperties;
  background?: string;
  border?: string;
  highlightBorder?: string;
  shadow?: string;
  hoverShadow?: string;
  focusShadow?: string;
  onHoverChange?: (isHovered: boolean) => void;
}

export function BaseCard({
  position,
  theme,
  children,
  onClick,
  isFocused = false,
  entranceIndex = 0,
  className,
  contentClassName,
  style,
  contentStyle,
  background = theme.card.background,
  border = theme.card.border,
  highlightBorder = `1px solid ${theme.accent.primary}40`,
  shadow = theme.card.shadow,
  hoverShadow = theme.card.hoverShadow,
  focusShadow = `0 0 0 3px ${theme.accent.primary}, ${hoverShadow}`,
  onHoverChange,
}: BaseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const isHighlighted = isHovered || isFocused;

  const handleHoverStart = () => {
    setIsHovered(true);
    onHoverChange?.(true);
  };

  const handleHoverEnd = () => {
    setIsHovered(false);
    onHoverChange?.(false);
  };

  return (
    <motion.div
      className={['absolute cursor-pointer select-none', className].filter(Boolean).join(' ')}
      style={{
        width: position.width,
        height: position.height,
        ...style,
      }}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: position.x,
        y: position.y,
        rotate: position.rotation,
      }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={{
        type: 'spring',
        stiffness: ANIMATION.SPRING.stiffness,
        damping: ANIMATION.SPRING.damping,
        delay: prefersReducedMotion ? 0 : unifiedGridCardEntranceDelay(entranceIndex),
      }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.015, y: -2 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      onClick={onClick}
    >
      <div
        className={[
          'group relative h-full w-full overflow-hidden transition-all duration-300 ease-out',
          contentClassName,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          ...contentStyle,
          background,
          border: isHighlighted ? highlightBorder : border,
          borderRadius: theme.card.borderRadius,
          boxShadow: isFocused ? focusShadow : isHovered ? hoverShadow : shadow,
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}
