'use client';

import { useEffect, useState } from 'react';

interface TypewriterProps {
  /** The full text to type out. */
  text: string;
  /** Delay before typing starts, in ms. */
  startDelay?: number;
  /** ms per character. Lower = faster typing. */
  speed?: number;
  /** Show a blinking underscore cursor at the end while typing. */
  cursor?: boolean;
  /** className for the visible (aria-hidden) span. */
  className?: string;
}

/**
 * Visual typewriter — types `text` character by character. The component is
 * `aria-hidden`; provide an `aria-label` on the parent so screen readers see
 * the final text immediately rather than racing with the typing.
 */
export function Typewriter({
  text,
  startDelay = 0,
  speed = 35,
  cursor = false,
  className = '',
}: TypewriterProps) {
  const [shown, setShown] = useState('');
  const isDone = shown.length >= text.length;

  useEffect(() => {
    let index = 0;
    let intervalId: number | undefined;

    const startId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        index += 1;
        setShown(text.slice(0, index));
        if (index >= text.length && intervalId !== undefined) {
          window.clearInterval(intervalId);
          intervalId = undefined;
        }
      }, speed);
    }, startDelay);

    return () => {
      window.clearTimeout(startId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [text, startDelay, speed]);

  return (
    <span className={className} aria-hidden="true">
      {shown}
      {cursor && !isDone ? <span className="animate-pulse">_</span> : null}
      {/*
        Reserve the remainder's width with an invisible inline span so the
        parent layout doesn't reflow as characters arrive. Without this, the
        Typewriter's growing width can produce subtle jitter on neighbouring
        elements (the logo above shifting by sub-pixels, etc.). Once typing
        is done, the remainder is empty and contributes no width.
      */}
      {!isDone ? (
        <span style={{ opacity: 0 }}>{text.slice(shown.length)}</span>
      ) : null}
    </span>
  );
}
