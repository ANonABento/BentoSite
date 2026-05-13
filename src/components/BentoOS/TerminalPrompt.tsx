'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TYPEWRITER_SPEED = 35;
const PROMPT_TEXT = 'system ready - press any key:';

export function TerminalPrompt() {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayedText(PROMPT_TEXT.slice(0, index));

      if (index >= PROMPT_TEXT.length) {
        window.clearInterval(timer);
        window.setTimeout(() => setShowCursor(true), 150);
      }
    }, TYPEWRITER_SPEED);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="font-crt text-sm sm:text-base md:text-lg tracking-[0.12em] whitespace-nowrap text-left"
      style={{
        color: 'var(--boot-orange)',
        // Override .font-crt's purple chromatic fringe — on orange text it
        // pulls the hue toward brown. Use a warm-only halation instead.
        textShadow:
          '0 0 6px rgba(244, 122, 32, 0.28), 1px 0 0 rgba(244, 122, 32, 0.18)',
      }}
    >
      <div className="flex items-center">
        <span className="text-[var(--text-muted)] mr-2" style={{ textShadow: 'none' }}>
          &gt;
        </span>
        <span>{displayedText}</span>
        {!showCursor && displayedText.length < PROMPT_TEXT.length ? (
          <span className="animate-pulse">_</span>
        ) : null}
      </div>
      {showCursor ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="mt-1 pl-[1.5ch]"
        >
          <span className="animate-blink">_</span>
        </motion.div>
      ) : null}
    </div>
  );
}
