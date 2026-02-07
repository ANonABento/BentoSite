'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HitRating } from '../Playground.types';
import { APPROACH_TIME, HIT_CIRCLE_SIZE } from './RhythmGame.config';

interface HitCircleProps {
  id: string;
  x: number;
  y: number;
  targetTime: number;
  hit: boolean;
  rating?: HitRating;
  onClick: (id: string) => void;
  getCurrentTime: () => number;
}

export function HitCircle({
  id,
  x,
  y,
  targetTime,
  hit,
  rating,
  onClick,
  getCurrentTime,
}: HitCircleProps) {
  const [approachProgress, setApproachProgress] = useState(0);

  useEffect(() => {
    if (hit) return;

    const update = () => {
      const currentTime = getCurrentTime();
      const elapsed = currentTime - (targetTime - APPROACH_TIME);
      const progress = Math.min(elapsed / APPROACH_TIME, 1);
      setApproachProgress(progress);

      if (!hit && progress < 1.5) {
        requestAnimationFrame(update);
      }
    };

    const frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [hit, targetTime, getCurrentTime]);

  // Approach circle shrinks from 2.5x to 1x
  const approachScale = 2.5 - approachProgress * 1.5;

  // Feedback colors using new design tokens
  const getFeedbackStyles = () => {
    switch (rating) {
      case 'perfect':
        return {
          color: 'var(--pg-game-perfect)',
          bg: 'var(--pg-game-perfect)',
          glow: '0 0 40px rgba(34, 211, 238, 0.6)',
        };
      case 'good':
        return {
          color: 'var(--pg-game-success)',
          bg: 'var(--pg-game-success)',
          glow: '0 0 40px rgba(74, 222, 128, 0.6)',
        };
      case 'miss':
        return {
          color: 'var(--pg-game-error)',
          bg: 'var(--pg-game-error)',
          glow: '0 0 40px rgba(248, 113, 113, 0.6)',
        };
      default:
        return {
          color: 'var(--purple)',
          bg: 'var(--purple)',
          glow: '0 0 30px rgba(167, 139, 250, 0.4)',
        };
    }
  };

  const feedbackStyles = getFeedbackStyles();

  // Pulse opacity based on approach
  const pulseOpacity = Math.sin(approachProgress * Math.PI * 4) * 0.2 + 0.8;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: hit ? 0 : 1,
        scale: hit ? 1.8 : 1,
      }}
      transition={{ duration: hit ? 0.3 : 0.15, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: 'translate(-50%, -50%)',
        width: HIT_CIRCLE_SIZE,
        height: HIT_CIRCLE_SIZE,
      }}
      onClick={() => !hit && onClick(id)}
      className="cursor-pointer"
    >
      {/* Outer glow */}
      {!hit && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, transparent 70%)',
            transform: `scale(${approachScale + 0.5})`,
          }}
        />
      )}

      {/* Approach circle */}
      {!hit && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '3px solid var(--pg-accent-gold)',
            transform: `scale(${approachScale})`,
            opacity: 0.9 * pulseOpacity,
            boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)',
          }}
        />
      )}

      {/* Inner circle background */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: hit
            ? feedbackStyles.bg
            : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 50%), linear-gradient(135deg, var(--purple), var(--pg-accent-gold))',
          border: '3px solid rgba(255, 255, 255, 0.4)',
          boxShadow: hit
            ? feedbackStyles.glow
            : `
              0 0 20px rgba(167, 139, 250, 0.4),
              inset 0 0 15px rgba(255, 255, 255, 0.1)
            `,
        }}
      />

      {/* Hit indicator (center dot) */}
      {!hit && (
        <div
          className="absolute rounded-full bg-white/80"
          style={{
            width: '30%',
            height: '30%',
            top: '35%',
            left: '35%',
            boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
          }}
        />
      )}

      {/* Hit feedback text */}
      {hit && rating && (
        <motion.div
          initial={{ y: 0, opacity: 1, scale: 1 }}
          animate={{ y: -40, opacity: 0, scale: 1.2 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            color: feedbackStyles.color,
            fontWeight: 'bold',
            fontSize: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textShadow: `0 2px 8px rgba(0,0,0,0.5), 0 0 20px ${feedbackStyles.color}`,
          }}
        >
          {rating}
        </motion.div>
      )}

      {/* Ripple effect on hit */}
      {hit && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${feedbackStyles.color}`,
          }}
        />
      )}
    </motion.div>
  );
}
