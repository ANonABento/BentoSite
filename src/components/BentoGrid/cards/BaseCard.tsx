'use client';

import type {
  CSSProperties,
  PointerEventHandler,
  ReactNode,
  WheelEventHandler,
} from 'react';
import { motion } from 'framer-motion';
import type { CardPosition, ThemeConfig } from '../BentoGrid.types';

interface BaseCardProps {
  id: string;
  position: CardPosition;
  theme: ThemeConfig;
  isFocused?: boolean;
  entranceIndex?: number;
  className?: string;
  shellClassName?: string;
  shellStyle?: CSSProperties;
  positionMode?: 'absolute' | 'fixed';
  hoverEnabled?: boolean;
  motionMode?: 'spring' | 'instant';
  ariaLabel?: string;
  children: ReactNode;
  onClick?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
  onWheel?: WheelEventHandler<HTMLDivElement>;
}

export function BaseCard({
  id,
  position,
  theme,
  isFocused = false,
  className,
  shellClassName,
  shellStyle,
  positionMode = 'absolute',
  hoverEnabled = true,
  ariaLabel,
  children,
  onClick,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
  onWheel,
}: BaseCardProps) {

  return (
    <motion.div
      key={id}
      className={[
        positionMode,
        onClick ? 'cursor-pointer' : 'cursor-default',
        'select-none',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        width: position.width,
        height: position.height,
      }}
      initial={false}
      animate={{
        x: position.x,
        y: position.y,
        rotate: position.rotation,
      }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      whileHover={hoverEnabled ? { scale: 1.02 } : undefined}
      whileTap={hoverEnabled ? { scale: 0.98 } : undefined}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onWheel={onWheel}
      aria-label={ariaLabel}
      data-magnetic={onClick ? true : undefined}
    >
      <div
        className={[
          'h-full w-full overflow-hidden transition-all duration-300 ease-out',
          shellClassName,
        ].filter(Boolean).join(' ')}
        style={{
          background: theme.card.background,
          border: isFocused ? `1px solid ${theme.accent.primary}66` : theme.card.border,
          borderRadius: theme.card.borderRadius,
          boxShadow: isFocused
            ? `0 0 0 3px ${theme.accent.primary}, ${theme.card.hoverShadow}`
            : theme.card.shadow,
          ...shellStyle,
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}
