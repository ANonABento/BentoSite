/**
 * Animated cursor stylesheet — injected once at runtime so we don't ship
 * cursor CSS to routes that never render the component.
 *
 * Tokens used: `--primary` (orange post-T5).
 */

export const CURSOR_STYLE_ID = 'animated-cursor-styles';

export function getCursorStyles(): string {
  return `
.animated-cursor {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  contain: strict;
  opacity: 0;
  transition: opacity 200ms ease-out;
}

.animated-cursor[data-visible="true"] {
  opacity: 1;
}

.animated-cursor__dot,
.animated-cursor__trail {
  position: fixed;
  top: 0;
  left: 0;
  border-radius: 9999px;
  pointer-events: none;
  will-change: transform;
}

.animated-cursor__dot {
  width: 10px;
  height: 10px;
  background: var(--primary, #e07b3c);
  box-shadow: 0 0 12px var(--primary, #e07b3c);
  mix-blend-mode: normal;
}

.animated-cursor__trail {
  width: 6px;
  height: 6px;
  background: var(--primary, #e07b3c);
  opacity: calc(0.55 - var(--trail-index, 0) * 0.1);
  filter: blur(0.5px);
}

.animated-cursor[data-reduced-motion="true"] .animated-cursor__trail {
  display: none;
}

@media (pointer: coarse) {
  .animated-cursor {
    display: none !important;
  }
}
`;
}
