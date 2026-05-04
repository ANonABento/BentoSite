import { describe, expect, it } from 'vitest';
import { isCursorActiveRoute } from './cursor-routes';

describe('isCursorActiveRoute', () => {
  it('returns true for the home route', () => {
    expect(isCursorActiveRoute('/')).toBe(true);
  });

  it('returns true for the projects route', () => {
    expect(isCursorActiveRoute('/projects')).toBe(true);
  });

  it('returns true for the playground route', () => {
    expect(isCursorActiveRoute('/playground')).toBe(true);
  });

  it('returns true for nested playground sub-routes', () => {
    expect(isCursorActiveRoute('/playground/2048')).toBe(true);
  });

  it('returns false for the scrollable route', () => {
    expect(isCursorActiveRoute('/scrollable')).toBe(false);
  });

  it('returns false for the photography route', () => {
    expect(isCursorActiveRoute('/photography')).toBe(false);
  });

  it('returns false when pathname is null or undefined', () => {
    expect(isCursorActiveRoute(null)).toBe(false);
    expect(isCursorActiveRoute(undefined)).toBe(false);
  });

  it('does not match a route that merely shares a prefix with /projects', () => {
    expect(isCursorActiveRoute('/projects-archive')).toBe(false);
  });
});
