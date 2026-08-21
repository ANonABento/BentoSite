export const BOOT_SESSION_KEY = 'bentOS.bootComplete';

export type BootState = 'checking' | 'booting' | 'exiting' | 'complete';

interface BootStateOptions {
  hasCompletedBoot: boolean;
  /**
   * True when the visitor arrived on a dashboard deep link (`?view=dashboard`
   * or `?project=`). Named for the decision rather than the URL shape: the
   * caller decides what counts as a reason to skip, this file only honours it.
   */
  skipBootSplash: boolean;
  isHardReload: boolean;
}

export function resolveBootState({
  hasCompletedBoot,
  skipBootSplash,
  isHardReload,
}: BootStateOptions): BootState {
  if (skipBootSplash) {
    return 'complete';
  }

  if (isHardReload) {
    return 'booting';
  }

  return hasCompletedBoot ? 'complete' : 'booting';
}

export function getNavigationWasReload(
  performanceApi: Pick<Performance, 'getEntriesByType'> | null | undefined
): boolean {
  try {
    const navigation = performanceApi?.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;

    return navigation?.type === 'reload';
  } catch {
    return false;
  }
}

interface HardReloadBootTracker {
  getPending: (
    performanceApi: Pick<Performance, 'getEntriesByType'> | null | undefined
  ) => boolean;
  markHandled: () => void;
}

export function createHardReloadBootTracker(): HardReloadBootTracker {
  let hardReloadBootHandled = false;

  return {
    getPending: (
      performanceApi: Pick<Performance, 'getEntriesByType'> | null | undefined
    ) => getNavigationWasReload(performanceApi) && !hardReloadBootHandled,
    markHandled: () => {
      hardReloadBootHandled = true;
    },
  };
}

export function readBootComplete(
  storage: Pick<Storage, 'getItem'> | null | undefined
): boolean {
  try {
    return storage?.getItem(BOOT_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeBootComplete(
  storage: Pick<Storage, 'setItem'> | null | undefined
): void {
  try {
    storage?.setItem(BOOT_SESSION_KEY, 'true');
  } catch {
    // Storage can be unavailable in private or restricted browsing modes.
  }
}
