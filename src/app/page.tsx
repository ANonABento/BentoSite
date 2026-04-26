'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { LazyMotion, domAnimation } from 'framer-motion';
import { BootScreen } from '@/components/BentoOS/BootScreen';
import { DashboardLayout } from '@/components/Dashboard';
import {
  KeyboardShortcutsModal,
  useKeyboardShortcutsHelp,
} from '@/components/ui/KeyboardShortcutsHelp';
import { LazyPanelFallback } from '@/components/ui';
import { ViewerSkeleton } from '@/components/Viewfinder/ViewerSkeleton';

const BOOT_SESSION_KEY = 'bentOS.bootComplete';

type BootState = 'booting' | 'exiting' | 'complete';

const Viewfinder = dynamic(
  () => import('@/components/Viewfinder').then((mod) => mod.Viewfinder),
  { ssr: false, loading: () => <ViewerSkeleton /> }
);

const Chatbot = dynamic(() => import('@/components/Chat'), {
  ssr: false,
  loading: () => (
    <LazyPanelFallback
      label="Initializing chat..."
      spinnerSize="sm"
      spinnerVariant="purple"
    />
  ),
});

const SkillsSection = dynamic(
  () => import('@/components/Skills/SkillsSection'),
  { ssr: false }
);

function subscribeToUrlChanges(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange);
  return () => window.removeEventListener('popstate', onStoreChange);
}

function getDashboardQuerySnapshot() {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).get('view') === 'dashboard';
}

function isHardReload() {
  const navigation = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;

  return navigation?.type === 'reload';
}

function hasCompletedBootInSession() {
  try {
    return window.sessionStorage.getItem(BOOT_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

function markBootCompleteInSession() {
  try {
    window.sessionStorage.setItem(BOOT_SESSION_KEY, 'true');
  } catch {
    // Storage can be unavailable in private or restricted browsing modes.
  }
}

function getInitialBootState(): BootState {
  if (typeof window === 'undefined') {
    return 'booting';
  }

  if (getDashboardQuerySnapshot()) {
    return 'complete';
  }

  if (isHardReload()) {
    return 'booting';
  }

  return hasCompletedBootInSession() ? 'complete' : 'booting';
}

export default function Home() {
  const startsInDashboard = useSyncExternalStore(
    subscribeToUrlChanges,
    getDashboardQuerySnapshot,
    () => false
  );
  const [bootState, setBootState] = useState<BootState>(getInitialBootState);
  const { isOpen: isShortcutsOpen, close: closeShortcuts } = useKeyboardShortcutsHelp();

  const handleBootExiting = useCallback(() => {
    setBootState('exiting');
  }, []);

  const handleBootComplete = useCallback(() => {
    markBootCompleteInSession();
    setBootState('complete');
  }, []);

  const showBoot = !startsInDashboard && bootState !== 'complete';
  const dashboardReady = startsInDashboard || bootState !== 'booting';

  return (
    <LazyMotion features={domAnimation}>
      <main
        id="main-content"
        className="h-screen overflow-hidden bg-[var(--background)] bg-grid transition-colors duration-300"
      >
        <DashboardLayout
          Viewfinder={Viewfinder}
          Chatbot={Chatbot}
          SkillsSection={SkillsSection}
          KeyboardShortcutsModal={KeyboardShortcutsModal}
          isShortcutsOpen={isShortcutsOpen}
          closeShortcuts={closeShortcuts}
          ready={dashboardReady}
        />
      </main>
      {showBoot ? (
        <BootScreen onExiting={handleBootExiting} onComplete={handleBootComplete} />
      ) : null}
    </LazyMotion>
  );
}
