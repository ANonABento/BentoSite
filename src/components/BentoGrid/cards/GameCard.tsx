'use client';

/**
 * GameCard - Playful themed card for games/fidgets
 *
 * Features:
 * - Synthwave neon styling
 * - Pixel corner accents
 * - Scanline overlay
 * - Best score display
 * - Neon glow on hover
 */

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Zap,
  Keyboard,
  Music,
  Grid3X3,
  Volume2,
  Ghost,
  BarChart2,
  Crosshair,
  Hash,
  Gamepad2,
} from 'lucide-react';
import type { GameCardData, CardPosition, ThemeConfig } from '../BentoGrid.types';
import { ANIMATION } from '../BentoGrid.constants';
import { unifiedGridCardEntranceDelay } from '@/lib/animations';

// =============================================================================
// ICON MAPPING
// =============================================================================

const GAME_ICONS: Record<string, React.ReactNode> = {
  reaction: <Zap className="w-6 h-6" />,
  typing: <Keyboard className="w-6 h-6" />,
  rhythm: <Music className="w-6 h-6" />,
  minesweeper: <Grid3X3 className="w-6 h-6" />,
  soundboard: <Volume2 className="w-6 h-6" />,
  game2048: <Hash className="w-6 h-6" />,
  '2048': <Hash className="w-6 h-6" />,
  sorting: <BarChart2 className="w-6 h-6" />,
  aim: <Crosshair className="w-6 h-6" />,
  'aim-trainer': <Crosshair className="w-6 h-6" />,
  pacman: <Ghost className="w-6 h-6" />,
  default: <Gamepad2 className="w-6 h-6" />,
};

// =============================================================================
// SYNTHWAVE COLORS
// =============================================================================

type AccentColor = 'pink' | 'purple' | 'cyan';

const ACCENT_COLORS: Record<AccentColor, {
  iconBg: string;
  iconText: string;
  scoreText: string;
  borderColor: string;
  glowColor: string;
  neonGlow: string;
}> = {
  pink: {
    iconBg: 'bg-[#ff007f]/15',
    iconText: 'text-[#ff007f]',
    scoreText: 'text-[#ff007f]',
    borderColor: '#ff007f',
    glowColor: 'rgba(255, 0, 127, 0.35)',
    neonGlow: '0 0 15px rgba(255, 0, 127, 0.5), 0 0 30px rgba(255, 0, 127, 0.25)',
  },
  purple: {
    iconBg: 'bg-[#bf00ff]/15',
    iconText: 'text-[#bf00ff]',
    scoreText: 'text-[#bf00ff]',
    borderColor: '#bf00ff',
    glowColor: 'rgba(191, 0, 255, 0.35)',
    neonGlow: '0 0 15px rgba(191, 0, 255, 0.5), 0 0 30px rgba(191, 0, 255, 0.25)',
  },
  cyan: {
    iconBg: 'bg-[#00ffff]/15',
    iconText: 'text-[#00ffff]',
    scoreText: 'text-[#00ffff]',
    borderColor: '#00ffff',
    glowColor: 'rgba(0, 255, 255, 0.35)',
    neonGlow: '0 0 15px rgba(0, 255, 255, 0.5), 0 0 30px rgba(0, 255, 255, 0.25)',
  },
};

// Rotate through colors based on card index
function getAccentColor(index: number): AccentColor {
  const colors: AccentColor[] = ['pink', 'purple', 'cyan'];
  return colors[index % colors.length];
}

// =============================================================================
// PROPS
// =============================================================================

export interface GameCardProps {
  card: GameCardData;
  position: CardPosition;
  theme: ThemeConfig;
  index?: number;
  onClick?: () => void;
  /** Whether the card has keyboard focus */
  isFocused?: boolean;
  /** Visible-order index used for entrance staggering */
  entranceIndex?: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function GameCard({
  card,
  position,
  theme,
  index = 0,
  onClick,
  isFocused = false,
  entranceIndex = 0,
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion() ?? false;
  // Load best score from localStorage lazily (synchronous on first render).
  // SSR is disabled for this page, so window is available when this renders.
  const [bestScore] = useState<string | null>(() => {
    if (typeof window === 'undefined' || !card.id) return null;
    return localStorage.getItem(`bestScore_${card.id}`);
  });
  const isHighlighted = isHovered || isFocused;

  const accentColor = getAccentColor(index);
  const colors = ACCENT_COLORS[accentColor];
  const icon = GAME_ICONS[card.id] || GAME_ICONS[card.icon || 'default'] || GAME_ICONS.default;

  return (
    <motion.div
      className="absolute cursor-pointer select-none"
      style={{
        width: position.width,
        height: position.height,
      }}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92, rotate: position.rotation }}
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
        stiffness: ANIMATION.SPRING.stiffness,
        damping: ANIMATION.SPRING.damping,
        delay: prefersReducedMotion ? 0 : unifiedGridCardEntranceDelay(entranceIndex),
      }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.015, y: -2 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div
        className="w-full h-full rounded-xl overflow-hidden bg-[#1a1a1a]/95 backdrop-blur-sm transition-all duration-300 ease-out group relative"
        style={{
          border: `2px solid ${isHighlighted ? colors.borderColor : 'rgba(255, 255, 255, 0.08)'}`,
          boxShadow: isFocused
            ? `0 0 0 3px ${colors.borderColor}, ${colors.neonGlow}`
            : isHovered
              ? colors.neonGlow
              : undefined,
          borderRadius: theme.card.borderRadius,
        }}
      >
        {/* Pixel corner accents */}
        <div
          className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl-sm transition-opacity duration-200"
          style={{ borderColor: colors.borderColor, opacity: isHighlighted ? 0.8 : 0.4 }}
        />
        <div
          className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 rounded-tr-sm transition-opacity duration-200"
          style={{ borderColor: colors.borderColor, opacity: isHighlighted ? 0.8 : 0.4 }}
        />
        <div
          className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 rounded-bl-sm transition-opacity duration-200"
          style={{ borderColor: colors.borderColor, opacity: isHighlighted ? 0.8 : 0.4 }}
        />
        <div
          className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br-sm transition-opacity duration-200"
          style={{ borderColor: colors.borderColor, opacity: isHighlighted ? 0.8 : 0.4 }}
        />

        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
          }}
        />

        {/* Hover gradient overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${colors.glowColor} 0%, transparent 50%)`,
          }}
        />

        {/* Card content */}
        <div className="relative z-10 p-4 h-full flex flex-col">
          {/* Icon */}
          <motion.div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.iconBg} ${colors.iconText} mb-3`}
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {icon}
          </motion.div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-white tracking-tight">
            {card.title}
          </h3>

          {/* Description */}
          {card.description && (
            <p className="text-sm text-white/50 mt-1 line-clamp-2">
              {card.description}
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Best score / Play prompt */}
          <div className="flex items-center justify-between mt-2">
            {bestScore || card.bestScore ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 uppercase tracking-wider">Best</span>
                <span className={`font-mono font-semibold text-sm ${colors.scoreText}`}>
                  {bestScore || card.bestScore}
                </span>
              </div>
            ) : (
              <span className="text-xs text-white/40">Click to play</span>
            )}

            {/* Play arrow (shows on hover) */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${colors.iconBg} ${colors.iconText} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom accent line (animates on hover) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
          style={{
            background: `linear-gradient(to right, ${colors.borderColor}, transparent)`,
          }}
        />
      </div>
    </motion.div>
  );
}
