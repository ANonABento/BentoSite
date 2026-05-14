/**
 * Duplicate-fill utility for the BentoGrid.
 *
 * When the source pool of cards (projects, games) is smaller than what
 * a wide viewport can display, the grid feels half-empty even when the
 * board controller fills to capacity. This helper extends the pool by
 * cycling cards with a `-clone-N` suffix so the same project can appear
 * multiple times around the canvas.
 *
 * Clones carry the same data as the original; only the `id` differs.
 * Use {@link stripCloneSuffix} on click handlers / router pushes to
 * resolve a clone back to its source id.
 */

import type { CardData } from './BentoGrid.types';

/** Fill target — matches the upper end of dynamicMaxVisible in the
 *  board controller. Wide displays may use up to ~60 cards. */
export const DEFAULT_FILL_TARGET = 48;

export const CLONE_SUFFIX = '-clone-';

export function duplicateCardsForFill<T extends CardData>(
  cards: T[],
  target: number = DEFAULT_FILL_TARGET,
): T[] {
  if (cards.length === 0) return cards;
  if (cards.length >= target) return cards;

  const result: T[] = [];
  let cycle = 0;
  while (result.length < target) {
    for (const card of cards) {
      const id = cycle === 0 ? card.id : `${card.id}${CLONE_SUFFIX}${cycle}`;
      result.push({ ...card, id });
      if (result.length >= target) break;
    }
    cycle += 1;
  }
  return result;
}

export function stripCloneSuffix(id: string): string {
  const idx = id.indexOf(CLONE_SUFFIX);
  return idx === -1 ? id : id.slice(0, idx);
}

export function isClone(id: string): boolean {
  return id.includes(CLONE_SUFFIX);
}
