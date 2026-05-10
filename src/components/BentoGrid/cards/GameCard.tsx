'use client';

/**
 * GameCard — media-first synthwave card for /playground.
 *
 * The card's "media" is a big neon icon centered against the dark backdrop.
 * Pixel corners, scanlines, and the bottom accent strip stay always-on (theme
 * identity). On hover/focus the bottom gradient overlay reveals title,
 * description, and best score. Accent color rotates per index.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
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
import { MediaCard } from './MediaCard';

// =============================================================================
// ICON MAPPING
// =============================================================================

const GAME_ICONS: Record<string, React.ReactNode> = {
  reaction: <Zap className="w-12 h-12" />,
  typing: <Keyboard className="w-12 h-12" />,
  rhythm: <Music className="w-12 h-12" />,
  minesweeper: <Grid3X3 className="w-12 h-12" />,
  soundboard: <Volume2 className="w-12 h-12" />,
  game2048: <Hash className="w-12 h-12" />,
  '2048': <Hash className="w-12 h-12" />,
  sorting: <BarChart2 className="w-12 h-12" />,
  aim: <Crosshair className="w-12 h-12" />,
  'aim-trainer': <Crosshair className="w-12 h-12" />,
  pacman: <Ghost className="w-12 h-12" />,
  default: <Gamepad2 className="w-12 h-12" />,
};

// =============================================================================
// SYNTHWAVE COLORS
// =============================================================================

type AccentColor = 'pink' | 'purple' | 'cyan';

const ACCENT_COLORS: Record<AccentColor, {
  iconText: string;
  scoreText: string;
  borderColor: string;
  glowColor: string;
  neonGlow: string;
}> = {
  pink: {
    iconText: 'text-[#ff007f]',
    scoreText: 'text-[#ff007f]',
    borderColor: '#ff007f',
    glowColor: 'rgba(255, 0, 127, 0.35)',
    neonGlow: '0 0 15px rgba(255, 0, 127, 0.5), 0 0 30px rgba(255, 0, 127, 0.25)',
  },
  purple: {
    iconText: 'text-[#bf00ff]',
    scoreText: 'text-[#bf00ff]',
    borderColor: '#bf00ff',
    glowColor: 'rgba(191, 0, 255, 0.35)',
    neonGlow: '0 0 15px rgba(191, 0, 255, 0.5), 0 0 30px rgba(191, 0, 255, 0.25)',
  },
  cyan: {
    iconText: 'text-[#00ffff]',
    scoreText: 'text-[#00ffff]',
    borderColor: '#00ffff',
    glowColor: 'rgba(0, 255, 255, 0.35)',
    neonGlow: '0 0 15px rgba(0, 255, 255, 0.5), 0 0 30px rgba(0, 255, 255, 0.25)',
  },
};

function getAccentColor(index: number): AccentColor {
  const colors: AccentColor[] = ['pink', 'purple', 'cyan'];
  return colors[((index % colors.length) + colors.length) % colors.length];
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
  const [bestScore] = useState<string | null>(() => {
    if (typeof window === 'undefined' || !card.id) return null;
    try {
      return localStorage.getItem(`bestScore_${card.id}`);
    } catch {
      return null;
    }
  });
  const isHighlighted = isHovered || isFocused;

  const accentColor = getAccentColor(index);
  const colors = ACCENT_COLORS[accentColor];
  const icon = GAME_ICONS[card.id] || GAME_ICONS[card.icon || 'default'] || GAME_ICONS.default;

  const score = bestScore ?? (card.bestScore != null ? String(card.bestScore) : null);

  const meta = (
    <>
      {card.description && (
        <p className="line-clamp-2 text-xs text-white/75">{card.description}</p>
      )}
      {score != null ? (
        <p className="font-mono text-[10px] uppercase tracking-wider flex gap-1.5 items-baseline">
          <span className="text-white/50">Best</span>
          <span className={`font-semibold ${colors.scoreText}`}>{score}</span>
        </p>
      ) : (
        <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
          Click to play
        </p>
      )}
    </>
  );

  // Synthwave-themed shell border + neon glow on hover/focus
  const shellStyle = {
    background: '#1a1a1a',
    border: `2px solid ${isHighlighted ? colors.borderColor : 'rgba(255, 255, 255, 0.08)'}`,
    boxShadow: isFocused
      ? `0 0 0 3px ${colors.borderColor}, ${colors.neonGlow}`
      : isHovered
        ? colors.neonGlow
        : theme.card.shadow,
  };

  const pixelCornerOpacity = isHighlighted ? 0.85 : 0.4;

  return (
    <MediaCard
      id={card.id}
      position={position}
      theme={theme}
      isFocused={isFocused}
      entranceIndex={entranceIndex}
      onClick={onClick}
      ariaLabel={card.title}
      title={card.title}
      metaLines={meta}
      shellStyle={shellStyle}
      onHoverChange={setIsHovered}
      shellExtras={
        <>
          {/* Pixel corner accents */}
          <div
            className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-opacity duration-200 z-[2]"
            style={{ borderColor: colors.borderColor, opacity: pixelCornerOpacity }}
          />
          <div
            className="pointer-events-none absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 transition-opacity duration-200 z-[2]"
            style={{ borderColor: colors.borderColor, opacity: pixelCornerOpacity }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 transition-opacity duration-200 z-[2]"
            style={{ borderColor: colors.borderColor, opacity: pixelCornerOpacity }}
          />
          <div
            className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-opacity duration-200 z-[2]"
            style={{ borderColor: colors.borderColor, opacity: pixelCornerOpacity }}
          />

          {/* Scanline overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04] z-[1]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
            }}
          />

          {/* Diagonal neon wash on hover */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[1]"
            style={{
              background: `linear-gradient(135deg, ${colors.glowColor} 0%, transparent 55%)`,
            }}
          />

          {/* Bottom accent line slides in on hover */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-[3]"
            style={{
              background: `linear-gradient(to right, ${colors.borderColor}, transparent)`,
            }}
          />
        </>
      }
    >
      {/* Centered neon icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className={`flex items-center justify-center ${colors.iconText}`}
          style={{
            filter: `drop-shadow(0 0 10px ${colors.glowColor})`,
          }}
          animate={{
            scale: isHovered ? 1.08 : 1,
            rotate: isHovered ? 4 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          {icon}
        </motion.div>
      </div>
    </MediaCard>
  );
}
