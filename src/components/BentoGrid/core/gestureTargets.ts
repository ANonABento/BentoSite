/**
 * Which pointer presses the canvas gesture is allowed to swallow.
 *
 * The search panel and its category row stop `pointerdown` so that dragging
 * inside them scrolls or selects text instead of panning the canvas. That is
 * right for the panel's own surface and wrong for the controls sitting on it:
 * `@use-gesture` suppresses the click that follows a `pointerdown` it never
 * saw, so swallowing the press on a chip left the chip inert — the category
 * filters did nothing at all for anyone using a pointer.
 */

const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, [role="button"]';

export function startsOnInteractiveControl(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  return target.closest(INTERACTIVE_SELECTOR) !== null;
}
