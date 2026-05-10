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
  const isInteractive = Boolean(onClick) || Boolean(href);
  const shell = (
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
  );

  return (
    <motion.div
      key={id}
      className={[
        positionMode,
        isInteractive ? 'cursor-pointer' : 'cursor-default',
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
      // Exit must complete on the same frame so AnimatePresence cannot reuse
      // the existing DOM node if the card's id is respawned by the queue
      // before exit finishes — that reuse would interpolate the node from its
      // old position to the new one via spring, "flying" across the viewport.
      exit={{ opacity: 0, transition: { duration: 0 } }}
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
    >
      {href ? (
        <a
          href={href}
          aria-label={ariaLabel}
          className="block h-full w-full no-underline text-inherit"
        >
          {shell}
        </a>
      ) : (
        shell
      )}
    </motion.div>
  );
}
