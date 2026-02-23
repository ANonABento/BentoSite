'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { buttonTap } from '@/lib/animations';

export interface SectionHeaderProps {
  title: string;
  /** Icon to display (required for consistency) */
  icon: ReactNode;
  /** Icon color: 'orange' or 'violet' (default) */
  iconColor?: 'orange' | 'violet';
  subtitle?: string;
  action?: ReactNode;
  /** Use monospace font for title (bentOS panel style) */
  mono?: boolean;
  collapsible?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function SectionHeader({
  title,
  icon,
  iconColor = 'violet',
  subtitle,
  action,
  mono = false,
  collapsible = false,
  isExpanded = true,
  onToggle,
}: SectionHeaderProps) {
  const iconColorClass = iconColor === 'orange'
    ? 'text-[var(--orange)]'
    : 'text-[var(--interactive)]';

  const titleClass = mono
    ? 'text-sm font-medium text-[var(--text-secondary)] font-mono tracking-wide'
    : 'text-sm font-medium text-[var(--text-secondary)]';

  const content = (
    <>
      <div className="flex items-center gap-2">
        <span className={iconColorClass}>{icon}</span>
        <span className={titleClass}>{title}</span>
        {mono && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--orange)] animate-pulse opacity-60" />
        )}
        {subtitle && (
          <span className={`text-xs text-[var(--text-muted)] ${mono ? 'font-mono' : ''}`}>{subtitle}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {action}
        {collapsible && (
          <motion.svg
            className="w-4 h-4 text-[var(--text-secondary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        )}
      </div>
    </>
  );

  if (collapsible && onToggle) {
    return (
      <motion.button
        onClick={onToggle}
        whileTap={buttonTap}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--glass-bg)] transition-colors"
        style={{ borderBottom: '1px solid transparent', borderImage: 'linear-gradient(90deg, transparent, var(--border), transparent) 1' }}
        aria-expanded={isExpanded}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <div
      className="flex-shrink-0 px-4 py-3 flex items-center justify-between"
      style={{ borderBottom: '1px solid transparent', borderImage: 'linear-gradient(90deg, transparent, var(--border), transparent) 1' }}
    >
      {content}
    </div>
  );
}

export default SectionHeader;
