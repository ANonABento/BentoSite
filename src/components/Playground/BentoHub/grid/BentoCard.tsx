'use client';

import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, PanInfo } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Keyboard,
  Music,
  Grid3X3,
  Volume2,
  Ghost,
  BarChart2,
  BarChart3,
  Crosshair,
  Hash,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import type { BentoCardConfig, CardColor, CardPosition } from '../BentoHub.types';
import { PHYSICS } from '../BentoHub.config';
import type { Vector2 } from '../physics';
import { usePhysicsContext } from './BentoGrid';
import { bentoCardEntrance } from '@/lib/animations';

interface BentoCardProps {
  config: BentoCardConfig;
  homePosition: CardPosition;
  bestScore?: string;
  index: number;
  registerForceUpdater: (cardId: string, updater: (force: Vector2) => void) => () => void;
}

// Icon mapping for games
const GAME_ICONS: Record<string, ReactNode> = {
  reaction: <Zap className="w-6 h-6" />,
  typing: <Keyboard className="w-6 h-6" />,
  rhythm: <Music className="w-6 h-6" />,
  stats: <BarChart3 className="w-6 h-6" />,
  minesweeper: <Grid3X3 className="w-6 h-6" />,
  soundboard: <Volume2 className="w-6 h-6" />,
  game2048: <Hash className="w-6 h-6" />,
  sorting: <BarChart2 className="w-6 h-6" />,
  aim: <Crosshair className="w-6 h-6" />,
  pacman: <Ghost className="w-6 h-6" />,
};

interface CardColorStyles {
  iconBg: string;
  iconText: string;
  scoreText: string;
  hoverGradient: string;
  accentLine: string;
  glowColor: string;
  borderGlow: string;
}

// Color config for card accents
const COLOR_CONFIG: Record<'cyan' | 'gold' | 'purple', CardColorStyles> = {
  gold: {
    iconBg: 'bg-[var(--pg-accent-gold)]/10',
    iconText: 'text-[var(--pg-accent-gold)]',
    scoreText: 'text-[var(--pg-accent-gold)]',
    hoverGradient: 'from-[var(--pg-accent-gold)]/10',
    accentLine: 'from-[var(--pg-accent-gold)]',
    glowColor: 'rgba(251, 191, 36, 0.25)',
    borderGlow: 'rgba(251, 191, 36, 0.2)',
  },
  purple: {
    iconBg: 'bg-[var(--purple)]/10',
    iconText: 'text-[var(--purple)]',
    scoreText: 'text-[var(--purple)]',
    hoverGradient: 'from-[var(--purple)]/10',
    accentLine: 'from-[var(--purple)]',
    glowColor: 'rgba(167, 139, 250, 0.25)',
    borderGlow: 'rgba(167, 139, 250, 0.2)',
  },
  cyan: {
    iconBg: 'bg-[var(--pg-accent-cyan)]/10',
    iconText: 'text-[var(--pg-accent-cyan)]',
    scoreText: 'text-[var(--pg-accent-cyan)]',
    hoverGradient: 'from-[var(--pg-accent-cyan)]/10',
    accentLine: 'from-[var(--pg-accent-cyan)]',
    glowColor: 'rgba(34, 211, 238, 0.25)',
    borderGlow: 'rgba(34, 211, 238, 0.2)',
  },
};

function getCardColorStyles(color: CardColor): CardColorStyles {
  switch (color) {
    case 'cyan':
      return COLOR_CONFIG.cyan;
    case 'purple':
      return COLOR_CONFIG.purple;
    case 'gold':
    case 'pink':
    case 'void':
      return COLOR_CONFIG.gold;
  }
}

export function BentoCard({ config, homePosition, bestScore, index, registerForceUpdater }: BentoCardProps) {
  const router = useRouter();
  const { engine } = usePhysicsContext();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [isDragging, setIsDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Motion values for position offset
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring animation for smooth movement
  const springX = useSpring(x, PHYSICS.returnSpring);
  const springY = useSpring(y, PHYSICS.returnSpring);

  // Register with physics engine
  useEffect(() => {
    if (engine) {
      engine.registerCard(config.id, homePosition);

      // Register force updater
      const unregister = registerForceUpdater(config.id, (force) => {
        if (!isDragging) {
          // Apply force as offset
          const newX = offsetRef.current.x + force.x;
          const newY = offsetRef.current.y + force.y;

          // Dampen the movement
          offsetRef.current = { x: newX * PHYSICS.dampingFactor, y: newY * PHYSICS.dampingFactor };

          x.set(offsetRef.current.x);
          y.set(offsetRef.current.y);

          // Update physics engine
          engine.updateCardOffset(config.id, offsetRef.current);
        }
      });

      return () => {
        engine.unregisterCard(config.id);
        unregister();
      };
    }
  }, [engine, config.id, homePosition, registerForceUpdater, isDragging, x, y]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    if (engine) {
      engine.setDragging(config.id, true);
    }
  }, [engine, config.id]);

  const handleDrag = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Update physics engine with current position during drag
      if (engine) {
        offsetRef.current = { x: info.offset.x, y: info.offset.y };
        engine.updateCardOffset(config.id, offsetRef.current);
      }
    },
    [engine, config.id]
  );

  const handleDragEnd = useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      if (engine) {
        engine.setDragging(config.id, false);
      }

      // Check if this was a click (minimal drag distance)
      const dragDistance = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
      if (dragDistance < 5 && config.href) {
        router.push(config.href);
        return;
      }

      // Spring back toward home with gravity influence
      offsetRef.current = { x: 0, y: 0 };
      x.set(0);
      y.set(0);

      if (engine) {
        engine.updateCardOffset(config.id, { x: 0, y: 0 });
      }
    },
    [engine, config.id, config.href, router, x, y]
  );

  const colors = getCardColorStyles(config.color);
  const icon = GAME_ICONS[config.id];
  const isWide = homePosition.width > homePosition.height * 1.35;
  const isCompact = homePosition.width < 150;
  const isTight = isCompact || homePosition.height < 150;

  return (
    <motion.div
      drag
      dragElastic={PHYSICS.dragElastic}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{
        x: springX,
        y: springY,
        position: 'absolute',
        left: homePosition.x,
        top: homePosition.y,
        width: homePosition.width,
        height: homePosition.height,
      }}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'z-50' : 'z-10'}`}
      custom={index}
      initial={prefersReducedMotion ? false : 'hidden'}
      animate={prefersReducedMotion ? undefined : 'visible'}
      variants={prefersReducedMotion ? undefined : bentoCardEntrance}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.018 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.975 }}
    >
      <div
        className="pg-surface-glass pg-hover-border-strong group relative h-full w-full overflow-hidden rounded-2xl transition-all duration-300"
        style={{
          boxShadow: isDragging
            ? `0 0 44px ${colors.glowColor}, 0 24px 70px rgba(0, 0, 0, 0.38)`
            : '0 18px 48px rgba(0, 0, 0, 0.18)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-70 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 0 0 1px ${colors.borderGlow}` }}
        />

        {/* Gradient overlay on hover */}
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${colors.hoverGradient} via-transparent to-transparent`}
        />

        <div className="pointer-events-none absolute right-3 top-3 h-16 w-16 rounded-full bg-[rgba(255,255,255,0.035)] blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

        {/* Card content */}
        <div className={`relative z-10 flex h-full ${isWide ? 'flex-row items-stretch gap-4' : 'flex-col'} ${isTight ? 'p-3' : 'p-4'}`}>
          <div className={`${isWide ? 'flex min-w-0 flex-1 flex-col' : 'contents'}`}>
            {/* Icon */}
            <motion.div
              className={`${isTight ? 'mb-2 h-10 w-10 rounded-lg' : 'mb-3 h-12 w-12 rounded-xl'} flex shrink-0 items-center justify-center ${colors.iconBg} ${colors.iconText}`}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
            >
              {icon}
            </motion.div>

            {/* Title */}
            <h3 className={`${isTight ? 'text-base' : 'text-lg'} text-balance font-semibold tracking-tight text-[var(--pg-text-primary)]`}>
              {config.title}
            </h3>

            {/* Description */}
            {config.description && (
              <p className={`${isTight ? 'line-clamp-1 text-xs leading-5' : 'line-clamp-2 text-sm leading-6'} mt-1 text-[var(--pg-text-muted)]`}>
                {config.description}
              </p>
            )}

            {/* Spacer */}
            <div className="flex-1" />
          </div>

          {/* Best score (for game cards) */}
          {config.contentType === 'game' && (
            <div className={`${isWide ? `${isTight ? 'min-w-[94px]' : 'min-w-[112px]'} flex-col items-end justify-between border-l border-[rgba(255,255,255,0.08)] pl-4` : 'mt-2 items-center justify-between'} flex`}>
              {bestScore ? (
                <div className={`${isWide ? 'items-end text-right' : 'items-center'} flex gap-2`}>
                  <span className="pg-label inline-flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    Best
                  </span>
                  <span className={`${isTight ? 'text-xs' : 'text-sm'} font-mono font-semibold ${colors.scoreText}`}>
                    {bestScore}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-medium text-[var(--pg-text-muted)]">Ready to play</span>
              )}

              {/* Play arrow */}
              <div
                className={`${isTight ? 'h-7 w-7' : 'h-8 w-8'} flex items-center justify-center rounded-full ${colors.iconBg} ${colors.iconText} opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100`}
              >
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          )}

          {/* Stats card special content */}
          {config.contentType === 'stat' && (
            <div className="pg-border-subtle mt-auto border-t pt-3">
              <div className="flex items-baseline gap-2">
                <span className={`${isTight ? 'text-xl' : 'text-2xl'} font-mono font-bold text-[var(--pg-accent-cyan)]`}>9</span>
                <span className="text-xs text-[var(--pg-text-muted)]">games</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--pg-text-muted)]">{config.description}</p>
            </div>
          )}
        </div>

        {/* Bottom accent line */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-[2px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left bg-gradient-to-r ${colors.accentLine} to-transparent`}
        />
      </div>
    </motion.div>
  );
}
