'use client';

/**
 * AnimatedCursor — custom cursor with smooth lerp tracking, trailing dots,
 * and magnetic attraction toward `[data-magnetic]` elements.
 *
 * Behaviour:
 * - Tracks pointer with requestAnimationFrame + lerp for smooth follow.
 * - Trail: small circles that follow at decreasing speeds (cheap CSS via
 *   chained lerps in the same rAF loop — no separate transitions per dot).
 * - Magnetic: when hovering an element with `[data-magnetic]`, the cursor
 *   target is biased toward the element's centre.
 * - Active only on the configured route prefixes (`/`, `/projects`,
 *   `/playground`). On other routes the cursor element is hidden and the
 *   rAF loop is not started.
 * - Disabled on coarse pointers (touch devices) — relies on `pointer: coarse`.
 * - Honours `prefers-reduced-motion: reduce` — disables trail and magnetic
 *   pull, only the dot is shown.
 *
 * Failure mode: if JS errors before the cursor mounts, browsers fall back to
 * the native cursor (we never set `cursor: none` on the document).
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { isCursorActiveRoute } from './cursor-routes';
import { CURSOR_STYLE_ID, getCursorStyles } from './cursor-styles';

const TRAIL_COUNT = 4;
/** Lerp factor for the leading dot — higher = snappier follow. */
const DOT_LERP = 0.28;
/** Magnetic pull strength when hovering a magnetic element (0–1). */
const MAGNETIC_STRENGTH = 0.35;
/** Hover activation distance for magnetic elements, in px past the element bounds. */
const MAGNETIC_PADDING = 24;

type Vec2 = { x: number; y: number };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function findMagneticTarget(x: number, y: number): HTMLElement | null {
  const el = document.elementFromPoint(x, y);
  if (!(el instanceof Element)) return null;
  const magnetic = el.closest('[data-magnetic]');
  return magnetic instanceof HTMLElement ? magnetic : null;
}

function injectStylesOnce(): void {
  if (document.getElementById(CURSOR_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = CURSOR_STYLE_ID;
  style.textContent = getCursorStyles();
  document.head.appendChild(style);
}

export function AnimatedCursor() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const trailRefs = useRef<Array<HTMLDivElement | null>>([]);

  const isActive = isCursorActiveRoute(pathname);

  useEffect(() => {
    if (!isActive) return;
    if (typeof window === 'undefined') return;

    // Bail on coarse pointers (touch). CSS also hides the element via
    // @media (pointer: coarse), but we additionally skip rAF + listeners.
    const coarseQuery = window.matchMedia('(pointer: coarse)');
    if (coarseQuery.matches) return;

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = reducedMotionQuery.matches;

    injectStylesOnce();

    const dot = dotRef.current;
    const trails = trailRefs.current.filter(
      (node): node is HTMLDivElement => node !== null
    );
    if (!dot) return;

    // State — using refs to avoid re-renders.
    const target: Vec2 = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const dotPos: Vec2 = { ...target };
    const trailPos: Vec2[] = trails.map(() => ({ ...target }));
    let currentMagnetic: HTMLElement | null = null;
    let rafId = 0;
    let visible = false;

    const setVisible = (next: boolean) => {
      if (visible === next) return;
      visible = next;
      if (rootRef.current) {
        rootRef.current.dataset.visible = next ? 'true' : 'false';
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      setVisible(true);

      // Refresh magnetic target only on move; cheap and correct enough.
      if (!prefersReducedMotion) {
        currentMagnetic = findMagneticTarget(event.clientX, event.clientY);
      } else {
        currentMagnetic = null;
      }
    };

    const handlePointerLeave = () => setVisible(false);
    const handlePointerEnter = () => setVisible(true);

    const tick = () => {
      let goalX = target.x;
      let goalY = target.y;

      if (currentMagnetic && !prefersReducedMotion) {
        const rect = currentMagnetic.getBoundingClientRect();
        // Only pull if pointer is reasonably near the element.
        const inside =
          target.x >= rect.left - MAGNETIC_PADDING &&
          target.x <= rect.right + MAGNETIC_PADDING &&
          target.y >= rect.top - MAGNETIC_PADDING &&
          target.y <= rect.bottom + MAGNETIC_PADDING;
        if (inside) {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          goalX = lerp(target.x, cx, MAGNETIC_STRENGTH);
          goalY = lerp(target.y, cy, MAGNETIC_STRENGTH);
        } else {
          currentMagnetic = null;
        }
      }

      dotPos.x = lerp(dotPos.x, goalX, DOT_LERP);
      dotPos.y = lerp(dotPos.y, goalY, DOT_LERP);
      dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%, -50%)`;

      if (!prefersReducedMotion) {
        // Each trail dot lerps toward the previous one with a softer factor.
        let leadX = dotPos.x;
        let leadY = dotPos.y;
        for (let i = 0; i < trails.length; i += 1) {
          const trail = trailPos[i];
          const factor = 0.18 - i * 0.025; // 0.18, 0.155, 0.13, 0.105
          trail.x = lerp(trail.x, leadX, Math.max(factor, 0.06));
          trail.y = lerp(trail.y, leadY, Math.max(factor, 0.06));
          const node = trails[i];
          if (node) {
            node.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0) translate(-50%, -50%)`;
          }
          leadX = trail.x;
          leadY = trail.y;
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
      if (rootRef.current) {
        rootRef.current.dataset.reducedMotion = event.matches ? 'true' : 'false';
      }
    };

    if (rootRef.current) {
      rootRef.current.dataset.reducedMotion = prefersReducedMotion ? 'true' : 'false';
      rootRef.current.dataset.visible = 'false';
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('pointerenter', handlePointerEnter);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('pointerenter', handlePointerEnter);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      ref={rootRef}
      className="animated-cursor"
      aria-hidden="true"
      data-visible="false"
    >
      {Array.from({ length: TRAIL_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(node) => {
            trailRefs.current[i] = node;
          }}
          className="animated-cursor__trail"
          style={{ '--trail-index': i } as React.CSSProperties}
        />
      ))}
      <div ref={dotRef} className="animated-cursor__dot" />
    </div>
  );
}
