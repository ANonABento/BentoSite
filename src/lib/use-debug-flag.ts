'use client';

import { useSyncExternalStore } from 'react';

/**
 * Returns true when the debug HUD should be visible:
 *   - in development builds, OR
 *   - when the page URL contains `?debug=1`.
 *
 * Uses `useSyncExternalStore` so server and initial client render both
 * return the same value (no hydration mismatch). The query string is
 * read via the client snapshot pass after mount.
 *
 * Production users without the flag never see debug overlays.
 */

const IS_DEV = process.env.NODE_ENV === 'development';

const emptySubscribe = () => () => {};

function getClientSnapshot(): boolean {
  if (IS_DEV) return true;
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === '1';
}

function getServerSnapshot(): boolean {
  // SSR has no access to query string; render with HUD off in production
  // so the markup matches the first client paint when the flag is absent.
  return IS_DEV;
}

export function useDebugFlag(): boolean {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}
