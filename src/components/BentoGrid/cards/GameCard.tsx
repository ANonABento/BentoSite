'use client';

/**
 * GameCard — arcade cabinet card for /playground.
 *
 * Uses the shared media-card shell, but keeps game metadata readable and avoids
 * the old oversaturated synthwave treatment.
 */

import { useMemo, useState } from 'react';
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
// ARCADE ACCENTS
// =============================================================================

type AccentColor = 'orange' | 'purple' | 'neutral';

const ACCENT_COLORS: Record<AccentColor, {
  className: string;
  color: string;
  muted: string;
  shadow: string;
}> = {
  orange: {
    className: 'text-[var(--orange)]',
    color: 'var(--orange)',
    muted: 'var(--orange-muted)',
    shadow: '0 18px 44px rgba(224, 123, 60, 0.18)',
  },
  purple: {
    className: 'text-[var(--purple)]',
    color: 'var(--purple)',
    muted: 'var(--purple-muted)',
    shadow: '0 18px 44px rgba(167, 139, 250, 0.16)',
  },
  neutral: {
    className: 'text-[var(--text-secondary)]',
    color: 'var(--text-secondary)',
    muted: 'rgba(255, 255, 255, 0.08)',
    shadow: '0 18px 44px rgba(0, 0, 0, 0.38)',
  },
};

function getAccentColor(index: number): AccentColor {
  const colors: AccentColor[] = ['orange', 'purple', 'neutral'];
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

  const colors = ACCENT_COLORS[getAccentColor(index)];
  const icon = GAME_ICONS[card.id] || GAME_ICONS[card.icon || 'default'] || GAME_ICONS.default;

  const score = bestScore ?? (card.bestScore != null ? String(card.bestScore) : null);
  const playLabel = useMemo(() => {
    if (score != null) return 'Resume';
    if (card.id === 'rhythm' || card.id === 'soundboard') return 'Open';
    return 'Play';
  }, [card.id, score]);

  const meta = (
    <>
      {card.description && (
        <p className="line-clamp-2 text-xs leading-snug text-white/75">{card.description}</p>
      )}
      {score != null ? (
        <p className="font-mono text-[10px] uppercase tracking-wider flex gap-1.5 items-baseline tabular-nums">
          <span className="text-white/50">Best</span>
          <span className={`font-semibold ${colors.className}`}>{score}</span>
        </p>
      ) : (
        <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
          {playLabel}
        </p>
      )}
    </>
  );

  const shellStyle = {
    background:
      'linear-gradient(145deg, rgba(255,255,255,0.07), rgba(20,20,32,0.92) 38%, rgba(5,6,18,0.98))',
    border: `1px solid ${isHighlighted ? colors.color : 'rgba(255, 255, 255, 0.1)'}`,
    boxShadow: isFocused
      ? `0 0 0 3px ${colors.color}, ${colors.shadow}`
      : isHovered
        ? colors.shadow
        : theme.card.shadow,
  };

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
      topLeft={
        <span
          className="rounded-[4px] border px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/75 backdrop-blur-md"
          style={{ borderColor: colors.color, background: colors.muted }}
        >
          {card.category ?? 'Game'}
        </span>
      }
      topRight={
        <span
          className="rounded-[4px] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-black"
          style={{ background: colors.color }}
        >
          {playLabel}
        </span>
      }
      shellExtras={
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22] z-[1]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100 z-[1]"
            style={{
              background: `radial-gradient(circle at 50% 34%, ${colors.muted} 0%, transparent 42%)`,
            }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-[3px] origin-left scale-x-75 transition-transform duration-300 group-hover:scale-x-100 z-[3]"
            style={{
              background: `linear-gradient(to right, ${colors.color}, transparent)`,
            }}
          />
        </>
      }
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className={`flex h-20 w-20 items-center justify-center rounded-[6px] border bg-black/20 backdrop-blur-sm ${colors.className}`}
          style={{
            borderColor: colors.muted,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), ${isHovered ? colors.shadow : 'none'}`,
          }}
          animate={{
            scale: isHovered ? 1.04 : 1,
            y: isHovered ? -2 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          {icon}
        </motion.div>
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[4] hidden md:block">
        <div className="max-w-full truncate font-mono text-[11px] uppercase tracking-wider text-white/70">
          {card.title.toUpperCase()}
        </div>
      </div>
    </MediaCard>
  );
}
