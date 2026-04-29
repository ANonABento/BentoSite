'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  BarChart2,
  Crosshair,
  Gamepad2,
  Ghost,
  Grid3X3,
  Hash,
  Keyboard,
  Music,
  Volume2,
  Zap,
} from 'lucide-react';
import type { GameCardData, CardPosition, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';

const GAME_ICONS: Record<string, ReactNode> = {
  reaction: <Zap className="h-6 w-6" />,
  typing: <Keyboard className="h-6 w-6" />,
  rhythm: <Music className="h-6 w-6" />,
  minesweeper: <Grid3X3 className="h-6 w-6" />,
  soundboard: <Volume2 className="h-6 w-6" />,
  game2048: <Hash className="h-6 w-6" />,
  '2048': <Hash className="h-6 w-6" />,
  sorting: <BarChart2 className="h-6 w-6" />,
  aim: <Crosshair className="h-6 w-6" />,
  'aim-trainer': <Crosshair className="h-6 w-6" />,
  pacman: <Ghost className="h-6 w-6" />,
  default: <Gamepad2 className="h-6 w-6" />,
};

const CORNER_ACCENTS = [
  'left-0 top-0 rounded-tl-sm border-l-2 border-t-2',
  'right-0 top-0 rounded-tr-sm border-r-2 border-t-2',
  'bottom-0 left-0 rounded-bl-sm border-b-2 border-l-2',
  'bottom-0 right-0 rounded-br-sm border-b-2 border-r-2',
] as const;

type AccentColor = 'rose' | 'purple' | 'cyan';

const ACCENT_COLORS: Record<
  AccentColor,
  { color: string; muted: string; glow: string; neonGlow: string }
> = {
  rose: {
    color: 'var(--pg-accent-rose)',
    muted: 'color-mix(in srgb, var(--pg-accent-rose) 15%, transparent)',
    glow: 'color-mix(in srgb, var(--pg-accent-rose) 35%, transparent)',
    neonGlow:
      '0 0 15px color-mix(in srgb, var(--pg-accent-rose) 50%, transparent), 0 0 30px color-mix(in srgb, var(--pg-accent-rose) 25%, transparent)',
  },
  purple: {
    color: 'var(--purple)',
    muted: 'var(--purple-muted)',
    glow: 'color-mix(in srgb, var(--purple) 35%, transparent)',
    neonGlow:
      '0 0 15px color-mix(in srgb, var(--purple) 50%, transparent), 0 0 30px color-mix(in srgb, var(--purple) 25%, transparent)',
  },
  cyan: {
    color: 'var(--pg-accent-cyan)',
    muted: 'color-mix(in srgb, var(--pg-accent-cyan) 15%, transparent)',
    glow: 'color-mix(in srgb, var(--pg-accent-cyan) 35%, transparent)',
    neonGlow:
      '0 0 15px color-mix(in srgb, var(--pg-accent-cyan) 50%, transparent), 0 0 30px color-mix(in srgb, var(--pg-accent-cyan) 25%, transparent)',
  },
};

function getAccentColor(index: number): AccentColor {
  const colors: AccentColor[] = ['rose', 'purple', 'cyan'];
  const normalizedIndex = ((index % colors.length) + colors.length) % colors.length;
  return colors[normalizedIndex];
}

function getStoredBestScore(cardId: string): string | null {
  if (typeof window === 'undefined' || !cardId) return null;

  try {
    return localStorage.getItem(`bestScore_${cardId}`);
  } catch {
    return null;
  }
}

export interface GameCardProps {
  card: GameCardData;
  position: CardPosition;
  theme: ThemeConfig;
  index?: number;
  onClick?: () => void;
  isFocused?: boolean;
  entranceIndex?: number;
}

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
    return getStoredBestScore(card.id);
  });

  const colors = ACCENT_COLORS[getAccentColor(index)];
  const icon = GAME_ICONS[card.id] || GAME_ICONS[card.icon || 'default'] || GAME_ICONS.default;
  const isHighlighted = isHovered || isFocused;
  const displayedBestScore = bestScore ?? (card.bestScore != null ? String(card.bestScore) : null);

  return (
    <BaseCard
      position={position}
      theme={theme}
      onClick={onClick}
      isFocused={isFocused}
      entranceIndex={entranceIndex}
      onHoverChange={setIsHovered}
      background="var(--pg-bg-elevated)"
      border="2px solid var(--glass-border)"
      highlightBorder={`2px solid ${colors.color}`}
      shadow="none"
      hoverShadow={colors.neonGlow}
      focusShadow={`0 0 0 3px ${colors.color}, ${colors.neonGlow}`}
      contentClassName="backdrop-blur-sm"
    >
      {CORNER_ACCENTS.map((className) => (
        <div
          key={className}
          className={`absolute h-3 w-3 transition-opacity duration-200 ${className}`}
          style={{ borderColor: colors.color, opacity: isHighlighted ? 0.8 : 0.4 }}
        />
      ))}

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--overlay) 2px, var(--overlay) 4px)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${colors.glow} 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 flex h-full flex-col p-4">
        <div
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:rotate-[5deg] group-hover:scale-105"
          style={{ background: colors.muted, color: colors.color }}
        >
          {icon}
        </div>

        <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {card.title}
        </h3>

        {card.description && (
          <p className="mt-1 line-clamp-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            {card.description}
          </p>
        )}

        <div className="flex-1" />

        <div className="mt-2 flex items-center justify-between">
          {displayedBestScore ? (
            <div className="flex items-center gap-2">
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Best
              </span>
              <span className="font-mono text-sm font-semibold" style={{ color: colors.color }}>
                {displayedBestScore}
              </span>
            </div>
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Click to play
            </span>
          )}

          <div
            className="flex h-7 w-7 items-center justify-center rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: colors.muted, color: colors.color }}
            aria-hidden="true"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{
          background: `linear-gradient(to right, ${colors.color}, transparent)`,
        }}
      />
    </BaseCard>
  );
}
