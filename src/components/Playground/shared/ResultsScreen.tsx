'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Home, Share2, Check } from 'lucide-react';
import Link from 'next/link';
import { staggerContainer, staggerItem, springs } from '../design';
import { AnimatedScore } from './AnimatedScore';

interface ResultStat {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface ResultsScreenProps {
  title: string;
  stats: ResultStat[];
  isNewHighScore?: boolean;
  onPlayAgain: () => void;
  homeHref?: string;
  /** Primary score to show as hero - index into stats array */
  primaryStatIndex?: number;
}

export function ResultsScreen({
  title,
  stats,
  isNewHighScore = false,
  onPlayAgain,
  homeHref = '/playground',
  primaryStatIndex = 0,
}: ResultsScreenProps) {
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shared'>('idle');
  const primaryStat = stats[primaryStatIndex];
  const secondaryStats = stats.filter((_, i) => i !== primaryStatIndex);

  // Parse primary value for animation
  const primaryValue =
    typeof primaryStat.value === 'number'
      ? primaryStat.value
      : parseInt(primaryStat.value.toString().replace(/[^\d]/g, ''), 10) || 0;
  const primarySuffix =
    typeof primaryStat.value === 'string'
      ? primaryStat.value.replace(/[\d,]/g, '').trim()
      : '';

  const handleShare = async () => {
    const shareText = `I scored ${primaryStat.value} in ${title}!`;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - ${primaryStat.value}`,
          text: shareText,
          url: shareUrl,
        });
        setShareState('shared');
        setTimeout(() => setShareState('idle'), 2000);
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    } catch {
      // Clipboard failed - could show error toast here
    }
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
    >
      {/* Title */}
      <motion.span
        variants={staggerItem}
        className="pg-label mb-8"
      >
        {title}
      </motion.span>

      {/* Hero score */}
      <motion.div
        variants={staggerItem}
        className="relative mb-10"
      >
        {/* Background glow */}
        <div className="absolute inset-0 blur-3xl bg-[var(--pg-accent-primary)]/20 rounded-full scale-150" />

        <div className="relative text-center">
          <AnimatedScore
            value={primaryValue}
            suffix={primarySuffix}
            delay={0.3}
            className="pg-score-hero font-mono text-[var(--pg-accent-primary)]"
          />

          {/* New high score badge */}
          {isNewHighScore && (
            <motion.div
              className="absolute -top-4 -right-4 sm:-right-8"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...springs.bouncy, delay: 0.6 }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[var(--pg-accent-primary)] text-black shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                NEW BEST
              </span>
            </motion.div>
          )}

          <motion.span
            className="block mt-2 text-[var(--pg-text-muted)] text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {primaryStat.label}
          </motion.span>
        </div>
      </motion.div>

      {/* Secondary stats */}
      {secondaryStats.length > 0 && (
        <motion.div
          variants={staggerContainer}
          className="flex flex-wrap justify-center gap-6 mb-10"
        >
          {secondaryStats.map((stat, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="text-center min-w-[80px]"
            >
              <div className="text-2xl font-bold font-mono text-[var(--pg-text-primary)] mb-1">
                {typeof stat.value === 'number' ? (
                  <AnimatedScore value={stat.value} delay={0.4 + index * 0.1} />
                ) : (
                  stat.value
                )}
              </div>
              <div className="pg-label">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Divider */}
      <motion.div
        variants={staggerItem}
        className="pg-fade-divider mb-8 h-px w-full max-w-xs"
      />

      {/* Action buttons */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onPlayAgain}
          className="pg-button pg-button-primary min-w-[160px]"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Play Again
        </button>
        <Link
          href={homeHref}
          className="pg-button pg-button-secondary min-w-[160px]"
        >
          <Home className="w-4 h-4 mr-2" />
          All Games
        </Link>
      </motion.div>

      {/* Share button with feedback */}
      <motion.button
        variants={staggerItem}
        className="mt-6 flex items-center gap-2 text-sm text-[var(--pg-text-muted)] hover:text-[var(--pg-text-secondary)] transition-colors"
        onClick={handleShare}
        disabled={shareState !== 'idle'}
      >
        {shareState === 'copied' ? (
          <>
            <Check className="w-4 h-4 text-[var(--pg-game-success)]" />
            <span className="text-[var(--pg-game-success)]">Copied to clipboard!</span>
          </>
        ) : shareState === 'shared' ? (
          <>
            <Check className="w-4 h-4 text-[var(--pg-game-success)]" />
            <span className="text-[var(--pg-game-success)]">Shared!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            Share Result
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
