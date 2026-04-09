'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, PanInfo } from 'framer-motion';
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
} from 'lucide-react';
import { BentoCardConfig, CardPosition } from '../BentoHub.types';
import { PHYSICS } from '../BentoHub.config';
import { usePhysicsContext } from './BentoGrid';

interface BentoCardProps {
  config: BentoCardConfig;
  homePosition: CardPosition;
  bestScore?: string;
  registerForceUpdater: (cardId: string, updater: (force: { x: number; y: number }) => void) => () => void;
}

// Icon mapping for games
const GAME_ICONS: Record<string, React.ReactNode> = {
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

// Color config for card accents
const COLOR_CONFIG: Record<string, {
  iconBg: string;
  iconText: string;
  scoreText: string;
  hoverGradient: string;
  accentLine: string;
  glowColor: string;
}> = {
  gold: {
    iconBg: 'bg-[var(--pg-accent-gold)]/10',
    iconText: 'text-[var(--pg-accent-gold)]',
    scoreText: 'text-[var(--pg-accent-gold)]',
    hoverGradient: 'from-[var(--pg-accent-gold)]/10',
    accentLine: 'from-[var(--pg-accent-gold)]',
    glowColor: 'rgba(251, 191, 36, 0.25)',
  },
  purple: {
    iconBg: 'bg-[var(--purple)]/10',
    iconText: 'text-[var(--purple)]',
    scoreText: 'text-[var(--purple)]',
    hoverGradient: 'from-[var(--purple)]/10',
    accentLine: 'from-[var(--purple)]',
    glowColor: 'rgba(167, 139, 250, 0.25)',
  },
  cyan: {
    iconBg: 'bg-[var(--pg-accent-cyan)]/10',
    iconText: 'text-[var(--pg-accent-cyan)]',
    scoreText: 'text-[var(--pg-accent-cyan)]',
    hoverGradient: 'from-[var(--pg-accent-cyan)]/10',
    accentLine: 'from-[var(--pg-accent-cyan)]',
    glowColor: 'rgba(34, 211, 238, 0.25)',
  },
};

export function BentoCard({ config, homePosition, bestScore, registerForceUpdater }: BentoCardProps) {
  const router = useRouter();
  const { engine } = usePhysicsContext();
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
          offsetRef.current = { x: newX * 0.95, y: newY * 0.95 };

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

  const colors = COLOR_CONFIG[config.color] || COLOR_CONFIG.gold;
  const icon = GAME_ICONS[config.id];

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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="pg-surface-glass pg-hover-border-strong w-full h-full rounded-2xl overflow-hidden transition-all duration-300 group"
        style={{
          boxShadow: isDragging ? `0 0 40px ${colors.glowColor}` : undefined,
        }}
      >
        {/* Gradient overlay on hover */}
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${colors.hoverGradient} via-transparent to-transparent`}
        />

        {/* Card content */}
        <div className="relative z-10 p-4 h-full flex flex-col">
          {/* Icon */}
          <motion.div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.iconBg} ${colors.iconText} mb-3`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
          >
            {icon}
          </motion.div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-[var(--pg-text-primary)] tracking-tight">
            {config.title}
          </h3>

          {/* Description */}
          {config.description && (
            <p className="text-sm text-[var(--pg-text-muted)] mt-1 line-clamp-2">
              {config.description}
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Best score (for game cards) */}
          {config.contentType === 'game' && (
            <div className="flex items-center justify-between mt-2">
              {bestScore ? (
                <div className="flex items-center gap-2">
                  <span className="pg-label">Best</span>
                  <span className={`font-mono font-semibold text-sm ${colors.scoreText}`}>
                    {bestScore}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-[var(--pg-text-muted)]">Click to play</span>
              )}

              {/* Play arrow */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${colors.iconBg} ${colors.iconText} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          )}

          {/* Stats card special content */}
          {config.contentType === 'stat' && (
            <div className="pg-border-subtle mt-auto border-t pt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-[var(--pg-accent-cyan)]">9</span>
                <span className="text-xs text-[var(--pg-text-muted)]">games</span>
              </div>
              <p className="mt-1 text-xs text-[var(--pg-text-muted)]">{config.description}</p>
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
