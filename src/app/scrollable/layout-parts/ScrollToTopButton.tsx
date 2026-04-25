'use client';

import { AnimatePresence, m } from 'framer-motion';

interface ScrollToTopButtonProps {
  visible: boolean;
  prefersReducedMotion: boolean;
  onClick: () => void;
}

export function ScrollToTopButton({
  visible,
  prefersReducedMotion,
  onClick,
}: ScrollToTopButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <m.button
          onClick={onClick}
          className="fixed bottom-6 left-4 sm:left-6 z-40 w-12 h-12 bg-[var(--glass-bg-strong)] hover:bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--border)] rounded-full shadow-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          aria-label="Scroll to top"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </m.button>
      )}
    </AnimatePresence>
  );
}
