'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export function TransparentHeader() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="backdrop-blur-xl bg-transparent border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Back button */}
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--pg-text-muted)] hover:text-[var(--pg-text-primary)] transition-colors group"
          >
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ x: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Home</span>
            </motion.div>
          </Link>

          {/* Title */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <motion.div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--pg-accent-gold)]/20 to-[var(--purple)]/20 flex items-center justify-center"
              animate={{
                boxShadow: [
                  '0 0 15px rgba(251, 191, 36, 0.2)',
                  '0 0 25px rgba(167, 139, 250, 0.3)',
                  '0 0 15px rgba(251, 191, 36, 0.2)',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Sparkles className="w-4 h-4 text-[var(--pg-accent-gold)]" />
            </motion.div>
            <div className="leading-none">
              <h1 className="text-lg font-semibold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--pg-accent-gold)] via-[var(--pg-text-primary)] to-[var(--purple)]">
                  Playground
                </span>
              </h1>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--pg-text-muted)]">
                arcade + interaction lab
              </p>
            </div>
          </div>

          <div className="pg-chip rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--pg-text-muted)]">
            Local scores
          </div>
        </div>
      </div>
    </motion.header>
  );
}
