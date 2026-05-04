'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TYPEWRITER_SPEED = 35;
const PROMPT_TEXT = 'initialized — tap, click, or press any key';

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
    <div className="font-mono text-xs text-[var(--orange)] tracking-wider whitespace-nowrap text-left">
      <div className="flex items-center">
        <span className="text-[var(--text-muted)] mr-1">&gt;</span>
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
          className="mt-1"
        >
          <span className="animate-blink">_</span>
        </motion.div>
      ) : null}
    </div>
  );
}
