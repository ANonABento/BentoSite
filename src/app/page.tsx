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
import {
  type BootState,
  createHardReloadBootTracker,
  readBootComplete,
  resolveBootState,
  writeBootComplete,
} from '@/lib/boot-session';

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

const hardReloadBootTracker = createHardReloadBootTracker();

function subscribeToLocationChanges(onStoreChange: () => void): () => void {
  window.addEventListener('popstate', onStoreChange);
  return () => window.removeEventListener('popstate', onStoreChange);
}

function getDashboardQuerySnapshot(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return new URLSearchParams(window.location.search).get('view') === 'dashboard';
}

function getBootStateSnapshot(): BootState {
  return resolveBootState({
    hasCompletedBoot: readBootComplete(window.sessionStorage),
    isDashboardView: getDashboardQuerySnapshot(),
    isHardReload: hardReloadBootTracker.getPending(window.performance),
  });
}

export default function Home() {
  const startsInDashboard = useSyncExternalStore(
    subscribeToLocationChanges,
    getDashboardQuerySnapshot,
    () => false
  );
  const sessionBootState = useSyncExternalStore(
    subscribeToLocationChanges,
    getBootStateSnapshot,
    () => 'checking'
  );
  const [bootStateOverride, setBootStateOverride] = useState<BootState | null>(null);
  const bootState = bootStateOverride ?? sessionBootState;
  const { isOpen: isShortcutsOpen, close: closeShortcuts } = useKeyboardShortcutsHelp();

  const handleBootExiting = useCallback(() => {
    setBootStateOverride('exiting');
  }, []);

  const handleBootComplete = useCallback(() => {
    writeBootComplete(window.sessionStorage);
    hardReloadBootTracker.markHandled();
    setBootStateOverride('complete');
  }, []);

  const showBoot = !startsInDashboard && bootState !== 'checking' && bootState !== 'complete';
  const dashboardReady =
    startsInDashboard || (bootState !== 'checking' && bootState !== 'booting');
  // True only when boot played within this mount; `bootStateOverride` is
  // null on subsequent visits and on `?view=dashboard` deep-links, so the
  // dashboard skips its entrance there and PageTransition handles the fade.
  const playEntrance =
    bootStateOverride === 'exiting' || bootStateOverride === 'complete';

  return (
    <LazyMotion features={domAnimation}>
      <main
        id="main-content"
        className="dashboard-crt h-screen overflow-hidden bg-[var(--background)] bg-grid transition-colors duration-300"
      >
        <DashboardLayout
          Viewfinder={Viewfinder}
          Chatbot={Chatbot}
          SkillsSection={SkillsSection}
          KeyboardShortcutsModal={KeyboardShortcutsModal}
          isShortcutsOpen={isShortcutsOpen}
          closeShortcuts={closeShortcuts}
          ready={dashboardReady}
          playEntrance={playEntrance}
        />
      </main>
      {showBoot ? (
        <BootScreen onExiting={handleBootExiting} onComplete={handleBootComplete} />
      ) : null}
    </LazyMotion>
  );
}
