'use client';

import { useCallback, useState } from 'react';

/**
 * Shared hover state for BentoGrid cards. Pairs with `BaseCard`'s
 * `onHoverStart`/`onHoverEnd` so each themed card doesn't reimplement
 * the same `useState(false)` + handler dance.
 */
export function useCardHover() {
  const [isHovered, setIsHovered] = useState(false);
  const onHoverStart = useCallback(() => setIsHovered(true), []);
  const onHoverEnd = useCallback(() => setIsHovered(false), []);
  return { isHovered, onHoverStart, onHoverEnd };
}
