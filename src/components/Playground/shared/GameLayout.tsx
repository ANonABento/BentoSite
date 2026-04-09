'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fadeUp, springs } from '../design';

interface GameLayoutProps {
  title: string;
  children: React.ReactNode;
  backHref?: string;
  /** Optional subtitle or status text */
  subtitle?: string;
  /** Optional right-side content for the header */
  headerRight?: React.ReactNode;
}

export function GameLayout({
  title,
  children,
  backHref = '/playground',
  subtitle,
  headerRight,
}: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--pg-bg-deep)] flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pg-gradient-radial pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.gentle}
        className="sticky top-0 z-40 backdrop-blur-xl bg-[color-mix(in_srgb,var(--pg-bg-surface)_80%,transparent)] border-b pg-border-subtle"
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={backHref}
              className="flex items-center gap-2 text-[var(--pg-text-muted)] hover:text-[var(--pg-text-primary)] transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium hidden sm:inline">Back</span>
            </Link>
            <div className="pg-divider" />
            <div className="flex items-center gap-3">
              <h1 className="text-base font-semibold text-[var(--pg-text-primary)] tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <>
                  <span className="text-[var(--pg-text-muted)]">·</span>
                  <span className="text-sm text-[var(--pg-text-secondary)]">{subtitle}</span>
                </>
              )}
            </div>
          </div>

          {headerRight && <div className="flex items-center gap-4">{headerRight}</div>}
        </div>
      </motion.header>

      {/* Content */}
      <motion.main
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col relative"
      >
        {children}
      </motion.main>
    </div>
  );
}
