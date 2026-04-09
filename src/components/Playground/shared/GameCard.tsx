'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { GameInfo } from '../Playground.types';
import { cardHover, springs } from '../design';

interface GameCardProps {
  game: GameInfo;
  bestScore?: string;
}

export function GameCard({ game, bestScore }: GameCardProps) {
  const isGold = game.color === 'orange';

  return (
    <Link href={game.path} className="block">
      <motion.div
        variants={cardHover}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        className="relative group h-full"
      >
        {/* Card container */}
        <div
          className={`
            relative overflow-hidden h-full
            pg-surface-glass
            pg-hover-border-medium
            rounded-2xl
            p-6
            transition-all duration-300
            group-hover:bg-[var(--pg-bg-hover)]
          `}
        >
          {/* Gradient overlay on hover */}
          <div
            className={`
              absolute inset-0 opacity-0 group-hover:opacity-100
              transition-opacity duration-500 pointer-events-none
              ${isGold
                ? 'bg-gradient-to-br from-[var(--pg-accent-gold)]/10 via-transparent to-transparent'
                : 'bg-gradient-to-br from-[var(--purple)]/10 via-transparent to-transparent'
              }
            `}
          />

          {/* Icon with animated glow */}
          <motion.div
            className={`
              relative w-14 h-14 mb-5
              flex items-center justify-center
              rounded-xl
              ${isGold
                ? 'bg-[var(--pg-accent-gold)]/10 text-[var(--pg-accent-gold)]'
                : 'bg-[var(--purple)]/10 text-[var(--purple)]'
              }
            `}
            whileHover={{
              scale: 1.05,
              boxShadow: isGold
                ? '0 0 30px rgba(251, 191, 36, 0.3)'
                : '0 0 30px rgba(167, 139, 250, 0.3)',
            }}
            transition={springs.snappy}
          >
            <div className="w-7 h-7">{game.icon}</div>
          </motion.div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-[var(--pg-text-primary)] mb-2 tracking-tight">
            {game.name}
          </h3>

          {/* Description */}
          <p className="text-[var(--pg-text-secondary)] text-sm leading-relaxed mb-5">
            {game.description}
          </p>

          {/* Best score or Play prompt */}
          <div className="flex items-center justify-between">
            {bestScore ? (
              <div className="flex items-center gap-2">
                <span className="pg-label">Best</span>
                <span
                  className={`
                    font-mono font-semibold text-sm
                    ${isGold ? 'text-[var(--pg-accent-gold)]' : 'text-[var(--purple)]'}
                  `}
                >
                  {bestScore}
                </span>
              </div>
            ) : (
              <span className="pg-label text-[var(--pg-text-muted)]">No score yet</span>
            )}

            {/* Play arrow */}
            <motion.div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${isGold
                  ? 'bg-[var(--pg-accent-gold)]/10 text-[var(--pg-accent-gold)]'
                  : 'bg-[var(--purple)]/10 text-[var(--purple)]'
                }
                opacity-0 group-hover:opacity-100
                transition-opacity duration-300
              `}
              initial={{ x: -5 }}
              whileHover={{ x: 0 }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.div>
          </div>

          {/* Bottom accent line */}
          <div
            className={`
              absolute bottom-0 left-0 right-0 h-[2px]
              transform scale-x-0 group-hover:scale-x-100
              transition-transform duration-300 origin-left
              ${isGold
                ? 'bg-gradient-to-r from-[var(--pg-accent-gold)] to-transparent'
                : 'bg-gradient-to-r from-[var(--purple)] to-transparent'
              }
            `}
          />
        </div>
      </motion.div>
    </Link>
  );
}
