'use client';

import { useEffect } from 'react';

/*
 * The boot: the tray is drawn at once, and each compartment's contents are
 * set into it, rippling out from the middle of the screen. No overlay, no
 * click. Once per tab session; skipped for deep links and reduced motion.
 */

const SEEN_KEY = 'bentOS.booted';
const STAGGER_MS = 300;
const FILL_MS = 380;

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

export function TrayFill() {
  useEffect(() => {
    if (!shouldBoot()) return;
    const root = document.documentElement;
    root.classList.add('tray-pending');
    let frame = 0;
    let tries = 0;
    let done = 0;

    // Cards mount a frame or two after the board measures itself; wait for them.
    const start = () => {
      const cells = Array.from(document.querySelectorAll<HTMLElement>('[data-bento-cell]'));
      if (!cells.length && ++tries < 30) {
        frame = requestAnimationFrame(start);
        return;
      }
      // Marked seen here, not on mount, so StrictMode's throwaway run can't skip it.
      try {
        sessionStorage.setItem(SEEN_KEY, '1');
      } catch {}
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const reach = Math.hypot(cx, cy);
      for (const cell of cells) {
        const r = cell.getBoundingClientRect();
        const d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
        cell.style.setProperty('--fill-delay', `${Math.round(Math.min(d / reach, 1) * STAGGER_MS)}ms`);
      }
      root.classList.replace('tray-pending', 'tray-filling');
      done = window.setTimeout(() => {
        root.classList.remove('tray-filling');
        for (const cell of cells) cell.style.removeProperty('--fill-delay');
      }, STAGGER_MS + FILL_MS + 50);
    };
    frame = requestAnimationFrame(start);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(done);
      root.classList.remove('tray-pending', 'tray-filling');
    };
  }, []);

  return null;
}
