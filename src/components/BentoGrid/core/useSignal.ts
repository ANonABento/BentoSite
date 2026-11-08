import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

/*
 * CRT in motion. The board is clean bento at rest; while the camera moves,
 * the signal shows: scanlines fade in and the cards' edges split into red and
 * cyan along the direction of travel, like a tube losing convergence. It all
 * settles back to clean as the camera stops.
 *
 * Writes CSS variables on `root` (no React renders):
 *   --sig    0..1 how strong
 *   --sig-x  --sig-y  fringe offset, in px, along the motion
 * and sets `data-signal` while it's on, so the costly filter only runs then.
 * At rest (no `data-signal`) the scanline layer isn't drawn at all (globals.css).
 */

type Camera = { x: number; y: number; zoom: number };

/** Screen px per frame (60 fps) below which nothing shows, and the span to full strength. */
const QUIET = 3;
const SPAN = 38;
/** How fast it fades once the camera stops, per frame. */
const DECAY = 0.86;
/** Fringe length at full strength, px. */
const FRINGE = 7;
/** The camera has been still this long: the signal is cleared outright, even if frames were throttled or dropped
 *  (a busy main thread during the boot, a background tab) and the fade never reached zero. */
const SETTLE_MS = 700;

export function useSignal(root: RefObject<HTMLElement | null>, camera: Camera) {
  const last = useRef({ ...camera, t: 0 });
  const state = useRef({ v: 0, dx: 0, dy: 0, frame: 0, at: 0, settle: 0 });
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const s = state.current;
    return () => {
      cancelAnimationFrame(s.frame);
      window.clearTimeout(s.settle);
      s.frame = 0;
      s.v = 0;
    };
  }, []);

  useLayoutEffect(() => {
    const now = performance.now();
    const prev = last.current;
    last.current = { ...camera, t: now };
    if (reduced.current || !prev.t) return;
    const frames = Math.max(1, (now - prev.t) / 16.7);
    // Movement on screen: pan in screen px, plus zoom as a fraction of the screen.
    const mx = ((camera.x - prev.x) * camera.zoom) / frames;
    const my = ((camera.y - prev.y) * camera.zoom) / frames;
    const mz = (Math.abs(Math.log(camera.zoom / prev.zoom)) * 900) / frames;
    const speed = Math.hypot(mx, my) + mz;
    const target = Math.min(1, Math.max(0, (speed - QUIET) / SPAN));
    const s = state.current;
    if (target > s.v) {
      s.v = s.v + (target - s.v) * 0.5;
      const len = Math.hypot(mx, my);
      // The camera moves one way, the picture the other.
      if (len > 0.5) { s.dx = -mx / len; s.dy = -my / len; }
    }
    if (s.v > 0.01 && !s.frame) {
      s.at = now;
      s.frame = requestAnimationFrame(tick);
    }
    window.clearTimeout(s.settle);
    if (s.v > 0) s.settle = window.setTimeout(clear, SETTLE_MS);

    function clear() {
      cancelAnimationFrame(s.frame);
      window.clearTimeout(s.settle);
      s.v = 0;
      s.frame = 0;
      const el = root.current;
      if (!el) return;
      el.removeAttribute('data-signal');
      el.style.setProperty('--sig', '0');
    }

    function tick(t: number) {
      const el = root.current;
      // The fade runs on time, not frames, so slow or dropped frames don't leave it hanging.
      s.v *= DECAY ** Math.max(1, (t - s.at) / 16.7);
      s.at = t;
      if (!el || s.v < 0.01) {
        clear();
        return;
      }
      el.setAttribute('data-signal', '');
      el.style.setProperty('--sig', s.v.toFixed(3));
      el.style.setProperty('--sig-x', `${(s.dx * s.v * FRINGE).toFixed(2)}px`);
      el.style.setProperty('--sig-y', `${(s.dy * s.v * FRINGE).toFixed(2)}px`);
      s.frame = requestAnimationFrame(tick);
    }
  }, [camera, root]);
}
