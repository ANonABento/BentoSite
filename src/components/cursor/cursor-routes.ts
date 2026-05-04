/**
 * Routes where the AnimatedCursor renders + animates.
 * Other routes fall back to the native cursor.
 */
export const CURSOR_ACTIVE_ROUTES = ['/', '/projects', '/playground'] as const;

export function isCursorActiveRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  // Match the exact route or a sub-path (e.g. /projects/foo).
  return CURSOR_ACTIVE_ROUTES.some((route) => {
    if (route === '/') return pathname === '/';
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}
