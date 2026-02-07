'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedScoreProps {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
  delay?: number;
}

/**
 * Animated score counter that smoothly counts up/down to the target value
 */
export function AnimatedScore({
  value,
  suffix = '',
  prefix = '',
  className = '',
  duration = 0.8,
  delay = 0,
}: AnimatedScoreProps) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const display = useTransform(spring, (latest) => {
    const rounded = Math.round(latest);
    return `${prefix}${rounded.toLocaleString()}${suffix}`;
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      spring.set(value);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [spring, value, delay]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      {display}
    </motion.span>
  );
}

interface AnimatedScoreWithLabelProps extends AnimatedScoreProps {
  label: string;
  highlight?: boolean;
}

/**
 * Score with label above it
 */
export function AnimatedScoreWithLabel({
  label,
  highlight = false,
  ...props
}: AnimatedScoreWithLabelProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="pg-label mb-2">{label}</span>
      <AnimatedScore
        {...props}
        className={`
          pg-score-large font-mono
          ${highlight
            ? 'text-[var(--pg-accent-gold)]'
            : 'text-[var(--pg-text-primary)]'
          }
          ${props.className || ''}
        `}
      />
    </div>
  );
}

/**
 * Hero-sized score display for main results
 */
export function HeroScore({
  value,
  suffix = '',
  label,
  sublabel,
  isNewBest = false,
}: {
  value: number;
  suffix?: string;
  label: string;
  sublabel?: string;
  isNewBest?: boolean;
}) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      {/* Label */}
      <motion.span
        className="pg-label block mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {label}
      </motion.span>

      {/* Score */}
      <div className="relative inline-block">
        <AnimatedScore
          value={value}
          suffix={suffix}
          delay={0.4}
          className="pg-score-hero font-mono text-[var(--pg-accent-gold)]"
        />

        {/* New best badge */}
        {isNewBest && (
          <motion.div
            className="absolute -top-2 -right-2 sm:-right-4"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 300, damping: 15 }}
          >
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-[var(--pg-accent-gold)] text-black">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              NEW BEST
            </span>
          </motion.div>
        )}
      </div>

      {/* Sublabel */}
      {sublabel && (
        <motion.span
          className="block mt-2 text-sm text-[var(--pg-text-muted)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {sublabel}
        </motion.span>
      )}
    </motion.div>
  );
}
