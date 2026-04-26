import { describe, expect, it, vi } from 'vitest';
import {
  BOOT_SESSION_KEY,
  getNavigationWasReload,
  readBootComplete,
  resolveBootState,
  writeBootComplete,
} from '../boot-session';

describe('boot-session utilities', () => {
  it('requires the boot sequence on a first normal visit', () => {
    expect(
      resolveBootState({
        hasCompletedBoot: false,
        isDashboardView: false,
        isHardReload: false,
      })
    ).toBe('booting');
  });

  it('skips the boot sequence after it has completed in the same session', () => {
    expect(
      resolveBootState({
        hasCompletedBoot: true,
        isDashboardView: false,
        isHardReload: false,
      })
    ).toBe('complete');
  });

  it('runs the boot sequence again on hard reload', () => {
    expect(
      resolveBootState({
        hasCompletedBoot: true,
        isDashboardView: false,
        isHardReload: true,
      })
    ).toBe('booting');
  });

  it('keeps dashboard query visits immediately available', () => {
    expect(
      resolveBootState({
        hasCompletedBoot: false,
        isDashboardView: true,
        isHardReload: true,
      })
    ).toBe('complete');
  });

  it('reads and writes the session boot marker', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    };

    expect(readBootComplete(storage)).toBe(false);

    writeBootComplete(storage);

    expect(storage.setItem).toHaveBeenCalledWith(BOOT_SESSION_KEY, 'true');
    expect(readBootComplete(storage)).toBe(true);
  });

  it('treats unavailable storage as incomplete without throwing', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('blocked');
      }),
      setItem: vi.fn(() => {
        throw new Error('blocked');
      }),
    };

    expect(readBootComplete(storage)).toBe(false);
    expect(() => writeBootComplete(storage)).not.toThrow();
  });

  it('detects reload navigation entries', () => {
    const performanceApi = {
      getEntriesByType: vi.fn(
        () => [{ type: 'reload' }] as PerformanceNavigationTiming[]
      ),
    };

    expect(getNavigationWasReload(performanceApi)).toBe(true);
  });

  it('treats missing navigation entries as normal navigation', () => {
    const performanceApi = {
      getEntriesByType: vi.fn(() => [] as PerformanceNavigationTiming[]),
    };

    expect(getNavigationWasReload(performanceApi)).toBe(false);
    expect(getNavigationWasReload(null)).toBe(false);
  });
});
