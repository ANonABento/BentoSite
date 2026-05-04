'use client';

import { useSyncExternalStore } from 'react';

const DEBUG_QUERY_PARAM = 'debug';
const DEBUG_QUERY_VALUE = '1';

const IS_DEV_BUILD = process.env.NODE_ENV === 'development';

function readDebugQueryFlag(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get(DEBUG_QUERY_PARAM) === DEBUG_QUERY_VALUE;
}

/**
 * Subscribes to navigation events that can change the URL's query
 * parameters: history `popstate`, plus our own `pushstate`/`replacestate`
 * relays would belong here too if the app dispatched them. For the HUD
 * use-case it's fine to only react to `popstate` — visitors who hit
 * `?debug=1` will trigger a fresh navigation anyway.
 */
function subscribeToHistory(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

function getQueryFlagSnapshot(): boolean {
  return readDebugQueryFlag();
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Returns `true` when developer-only UI (debug HUDs, telemetry overlays)
 * should be rendered.
 *
 * Enabled when:
 * - the build is `process.env.NODE_ENV === 'development'`, OR
 * - the URL contains `?debug=1` in any environment (including prod).
 *
 * Production builds without the query param render `false` so we never
 * ship raw camera/queue stats to real visitors.
 *
 * SSR-safe via `useSyncExternalStore` (server snapshot is `false`,
 * client snapshot reads the URL after mount).
 */
export function useDebugFlag(): boolean {
  const queryFlag = useSyncExternalStore(
    subscribeToHistory,
    getQueryFlagSnapshot,
    getServerSnapshot,
  );

  return IS_DEV_BUILD || queryFlag;
}
