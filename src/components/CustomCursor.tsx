'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const TRAIL_COUNT = 4;
const INTERACTIVE_SELECTOR =
  'a[href], button, input, textarea, select, summary, [role="button"], [data-magnetic]';
const MAGNETIC_SELECTOR = '[data-magnetic], button, a[href], [role="button"]';

function supportsCustomCursor(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }

  return (
    pathname === '/' ||
    pathname === '/projects' ||
    pathname.startsWith('/projects/') ||
    pathname === '/playground' ||
    pathname.startsWith('/playground/')
  );
}

function isEnabledControl(element: Element): boolean {
  if (element.getAttribute('aria-disabled') === 'true') {
    return false;
  }

  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return !element.disabled;
  }

  return true;
}

function createCursorRoot(): {
  root: HTMLDivElement;
  cursor: HTMLDivElement;
  trails: HTMLSpanElement[];
} {
  const root = document.createElement('div');
  root.className = 'custom-cursor-root';
  root.setAttribute('aria-hidden', 'true');

  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';

  const trails = Array.from({ length: TRAIL_COUNT }, (_, index) => {
    const trail = document.createElement('span');
    trail.className = 'custom-cursor-trail';
    const size = 9 - index;
    trail.style.width = `${size}px`;
    trail.style.height = `${size}px`;
    trail.style.opacity = String(0.3 - index * 0.045);
    root.appendChild(trail);
    return trail;
  });

  root.appendChild(cursor);
  document.body.appendChild(root);

  return { root, cursor, trails };
}

export function CustomCursor() {
  const pathname = usePathname();
  const [canUseCustomCursor, setCanUseCustomCursor] = useState(false);

  useEffect(() => {
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateCapability = () => {
      setCanUseCustomCursor(
        !coarsePointerQuery.matches && !reducedMotionQuery.matches
      );
    };

    updateCapability();
    coarsePointerQuery.addEventListener('change', updateCapability);
    reducedMotionQuery.addEventListener('change', updateCapability);

    return () => {
      coarsePointerQuery.removeEventListener('change', updateCapability);
      reducedMotionQuery.removeEventListener('change', updateCapability);
    };
  }, []);

  useEffect(() => {
    if (!supportsCustomCursor(pathname) || !canUseCustomCursor) {
      return;
    }

    const { root, cursor, trails } = createCursorRoot();
    document.body.classList.add('custom-cursor-enabled');

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let cursorX = pointerX;
    let cursorY = pointerY;
    let magneticTarget: HTMLElement | null = null;
    let isVisible = false;
    let animationFrame = 0;

    const trailPositions = trails.map(() => ({ x: pointerX, y: pointerY }));

    const setVisible = (visible: boolean) => {
      if (isVisible === visible) {
        return;
      }

      isVisible = visible;
      root.classList.toggle('is-visible', visible);
    };

    const getMagneticTarget = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof Element)) {
        return null;
      }

      const candidate = target.closest(MAGNETIC_SELECTOR);
      if (!(candidate instanceof HTMLElement) || !isEnabledControl(candidate)) {
        return null;
      }

      return candidate;
    };

    const updateInteractiveState = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        magneticTarget = null;
        root.classList.remove('is-hovering');
        return;
      }

      const interactive = target.closest(INTERACTIVE_SELECTOR);
      const isHovering =
        interactive instanceof Element && isEnabledControl(interactive);

      magneticTarget = getMagneticTarget(target);
      root.classList.toggle('is-hovering', isHovering);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      setVisible(true);
      updateInteractiveState(event.target);
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) {
        setVisible(false);
        magneticTarget = null;
        root.classList.remove('is-hovering');
      }
    };

    const animate = () => {
      let targetX = pointerX;
      let targetY = pointerY;

      if (magneticTarget && document.body.contains(magneticTarget)) {
        const rect = magneticTarget.getBoundingClientRect();
        targetX = pointerX + (rect.left + rect.width / 2 - pointerX) * 0.32;
        targetY = pointerY + (rect.top + rect.height / 2 - pointerY) * 0.32;
      }

      cursorX += (targetX - cursorX) * 0.28;
      cursorY += (targetY - cursorY) * 0.28;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;

      trails.forEach((trail, index) => {
        const position = trailPositions[index];
        const ease = 0.2 - index * 0.025;
        position.x += (cursorX - position.x) * ease;
        position.y += (cursorY - position.y) * ease;
        trail.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`;
      });

      animationFrame = window.requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerout', handlePointerOut, { passive: true });
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerout', handlePointerOut);
      window.cancelAnimationFrame(animationFrame);
      document.body.classList.remove('custom-cursor-enabled');
      root.remove();
    };
  }, [canUseCustomCursor, pathname]);

  return null;
}
