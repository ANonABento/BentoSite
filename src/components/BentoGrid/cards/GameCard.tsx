'use client';

import { useState } from 'react';
import {
  BarChart2,
  Crosshair,
  Gamepad2,
  Grid3X3,
  Hash,
  Keyboard,
  Music,
  Volume2,
  Zap,
} from 'lucide-react';
import type { CardPosition, GameCardData, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';

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
  default: <Gamepad2 className="w-6 h-6" />,
};

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
    if (typeof window === 'undefined' || !card.id) return null;
    return localStorage.getItem(`bestScore_${card.id}`);
  });
  const icon = GAME_ICONS[card.id] || GAME_ICONS[card.icon || 'default'] || GAME_ICONS.default;
  const accents = [theme.accent.secondary, theme.accent.primary, theme.accent.tertiary ?? theme.accent.primary];
  const accent = accents[index % accents.length];

  return (
    <BaseCard
      id={card.id}
      position={position}
      theme={theme}
      isFocused={isFocused || isHovered}
      entranceIndex={entranceIndex}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="w-full h-full backdrop-blur-sm group relative">
        <div
          className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl-sm transition-opacity duration-200"
          style={{ borderColor: accent, opacity: isHovered || isFocused ? 0.85 : 0.45 }}
        />
        <div
          className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 rounded-tr-sm transition-opacity duration-200"
          style={{ borderColor: accent, opacity: isHovered || isFocused ? 0.85 : 0.45 }}
        />
        <div
          className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 rounded-bl-sm transition-opacity duration-200"
          style={{ borderColor: accent, opacity: isHovered || isFocused ? 0.85 : 0.45 }}
        />
        <div
          className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br-sm transition-opacity duration-200"
          style={{ borderColor: accent, opacity: isHovered || isFocused ? 0.85 : 0.45 }}
        />

        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${accent}26 0%, transparent 54%)`,
          }}
        />

        <div className="relative z-10 p-4 h-full flex flex-col">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{
              background: `${accent}24`,
              color: accent,
            }}
          >
            {icon}
          </div>

          <h3 className="text-lg font-semibold text-[var(--foreground)] tracking-tight">
            {card.title}
          </h3>

          {card.description && (
            <p className="text-sm text-[var(--muted-foreground)] mt-1 line-clamp-2">
              {card.description}
            </p>
          )}

          <div className="flex-1" />

          <div className="flex items-center justify-between mt-2">
            {bestScore || card.bestScore ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">
                  Best
                </span>
                <span className="font-mono font-semibold text-sm" style={{ color: accent }}>
                  {bestScore || card.bestScore}
                </span>
              </div>
            ) : (
              <span className="text-xs text-[var(--muted-foreground)]">Click to play</span>
            )}

            <div
              className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `${accent}24`,
                color: accent,
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
          style={{
            background: `linear-gradient(to right, ${accent}, transparent)`,
          }}
        />
      </div>
    </BaseCard>
  );
}
