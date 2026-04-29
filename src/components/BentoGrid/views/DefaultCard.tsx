'use client';

import { motion } from 'framer-motion';
import { ANIMATION } from '../BentoGrid.constants';
import type { CardData, CardPosition, ThemeConfig } from '../BentoGrid.types';

interface DefaultCardProps {
  card: CardData;
  position: CardPosition;
  theme: ThemeConfig;
  onClick?: () => void;
  isFocused?: boolean;
}

export function DefaultCard({
  card,
  position,
  theme,
  onClick,
  isFocused,
}: DefaultCardProps) {
  return (
    <motion.div
      layoutId={card.id}
      className="absolute cursor-pointer select-none"
      style={{
        width: position.width,
        height: position.height,
        background: theme.card.background,
        border: theme.card.border,
        borderRadius: theme.card.borderRadius,
        boxShadow: isFocused
          ? `0 0 0 3px ${theme.accent.primary}, ${theme.card.hoverShadow}`
          : theme.card.shadow,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: isFocused ? 1.02 : 1,
        x: position.x,
        y: position.y,
        rotate: position.rotation,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type: 'spring',
        stiffness: ANIMATION.SPRING.stiffness,
        damping: ANIMATION.SPRING.damping,
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: theme.card.hoverShadow,
      }}
      onClick={onClick}
    >
      <div className="p-4 h-full flex flex-col">
        <h3 className="font-bold text-white text-lg truncate">{card.title}</h3>
        {card.description && (
          <p className="text-sm text-white/60 mt-2 line-clamp-2">{card.description}</p>
        )}
        {card.category && (
          <span
            className="mt-auto inline-block px-2 py-1 text-xs rounded-full w-fit"
            style={{
              background: `${theme.accent.primary}20`,
              color: theme.accent.primary,
            }}
          >
            {card.category}
          </span>
        )}
      </div>
    </motion.div>
  );
}
