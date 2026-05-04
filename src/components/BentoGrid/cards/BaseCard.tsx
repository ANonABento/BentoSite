'use client';

import type {
  CSSProperties,
  MouseEvent,
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
  href?: string;
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
  href,
  children,
  onClick,
  onHoverStart,
  onHoverEnd,
  onPointerDown,
  onWheel,
}: BaseCardProps) {
  const handleAnchorClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onClick) return;
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.currentTarget.target
    ) {
      return;
    }

    event.preventDefault();
    onClick();
  };

  return (
    <motion.div
      key={id}
      className={[
        positionMode,
        href || onClick ? 'cursor-pointer' : 'cursor-default',
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
      onClick={href ? undefined : onClick}
      onPointerDown={onPointerDown}
      onWheel={onWheel}
      aria-label={href ? undefined : ariaLabel}
    >
      <div
        className={[
          'relative h-full w-full overflow-hidden transition-all duration-300 ease-out',
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
        {href ? (
          <a
            href={href}
            onClick={handleAnchorClick}
            aria-label={ariaLabel}
            className="absolute inset-0 z-0"
          />
        ) : null}
        <div className={href ? 'relative z-10 h-full w-full pointer-events-none' : 'h-full w-full'}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}
