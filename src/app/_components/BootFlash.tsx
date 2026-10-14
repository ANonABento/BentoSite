'use client';

import { useEffect, useState } from 'react';
import { BentoIcon } from '@/components/BentoIcon';

/*
 * The power-on: a phosphor line draws across a dark screen, then the screen
 * splits open from the middle onto the board, which is already live
 * underneath. Under a second, never waits for a click, and lets clicks
 * through the whole time. Once per tab session; skipped for deep links and
 * reduced motion.
 */

const SEEN_KEY = 'bentOS.booted';

function shouldBoot(): boolean {
  if (new URLSearchParams(window.location.search).has('project')) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return !sessionStorage.getItem(SEEN_KEY);
  } catch {
    // Storage blocked: boot every time, it's short.
    return true;
  }
}

export function BootFlash() {
  const [on, setOn] = useState(shouldBoot);
  // Marked seen after mount, so a double-invoked initializer can't skip it.
  // The timer is a backstop in case animationend never arrives.
  useEffect(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {}
    const backstop = window.setTimeout(() => setOn(false), 1500);
    return () => window.clearTimeout(backstop);
  }, []);
  if (!on) return null;

  return (
    <div className="boot" aria-hidden="true" onAnimationEnd={(e) => e.animationName === 'boot-done' && setOn(false)}>
      <div className="boot-shutter boot-shutter-top" />
      <div className="boot-shutter boot-shutter-bottom" />
      <div className="boot-line" />
      <div className="boot-mark">
        <BentoIcon size={44} />
      </div>
    </div>
  );
}
