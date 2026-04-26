export const BOOT_SESSION_KEY = 'bentOS.bootComplete';

export type BootState = 'checking' | 'booting' | 'exiting' | 'complete';

interface BootStateOptions {
  hasCompletedBoot: boolean;
  isDashboardView: boolean;
  isHardReload: boolean;
}

export function resolveBootState({
  hasCompletedBoot,
  isDashboardView,
  isHardReload,
}: BootStateOptions): BootState {
  if (isDashboardView) {
    return 'complete';
  }

  if (isHardReload) {
    return 'booting';
  }

  return hasCompletedBoot ? 'complete' : 'booting';
}

export function getNavigationWasReload(
  performanceApi: Pick<Performance, 'getEntriesByType'> | null | undefined
) {
  try {
    const navigation = performanceApi?.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;

    return navigation?.type === 'reload';
  } catch {
    return false;
  }
}

export function readBootComplete(
  storage: Pick<Storage, 'getItem'> | null | undefined
) {
  try {
    return storage?.getItem(BOOT_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeBootComplete(
  storage: Pick<Storage, 'setItem'> | null | undefined
) {
  try {
    storage?.setItem(BOOT_SESSION_KEY, 'true');
  } catch {
    // Storage can be unavailable in private or restricted browsing modes.
  }
}
