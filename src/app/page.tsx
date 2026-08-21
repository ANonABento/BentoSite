'use client';

import { Suspense, useCallback, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
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

// Boot state changes only via local state setters (handleBootExiting /
// handleBootComplete) and via re-render when the URL changes — no external
// subscription needed.
const subscribeNoop = () => () => {};

// `?view=dashboard` AND `?project=<id>` are both dashboard deep-links —
// visitors arriving on either skip the boot splash and land on the dashboard.
function isDashboardDeepLink(params: URLSearchParams): boolean {
  return params.get('view') === 'dashboard' || params.has('project');
}

function readBootStateClient(skipBootSplash: boolean): BootState {
  return resolveBootState({
    hasCompletedBoot: readBootComplete(window.sessionStorage),
    skipBootSplash,
    isHardReload: hardReloadBootTracker.getPending(window.performance),
  });
}

// Inner component reads useSearchParams; Next requires it under a Suspense
// boundary so the prerender step can bail out to client rendering cleanly.
function HomeInner() {
  // useSearchParams from next/navigation is reactive to both popstate and
  // router.push (internally pushState), so navigating /?project=A →
  // /?project=B inside the SPA updates `initialProjectId` and re-skins the
  // dashboard.
  const searchParams = useSearchParams();
  // ReadonlyURLSearchParams shares the URLSearchParams shape (`get`, `has`).
  const isDeepLink = isDashboardDeepLink(searchParams as unknown as URLSearchParams);
  const initialProjectId = searchParams.get('project') ?? undefined;

  // Reads sessionStorage + performance lazily via useSyncExternalStore so
  // SSR returns 'checking' (hydration-safe) and the client returns the real
  // boot state on first commit.
  const sessionBootState = useSyncExternalStore<BootState>(
    subscribeNoop,
    () => readBootStateClient(isDeepLink),
    () => 'checking',
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

  const showBoot = !isDeepLink && bootState !== 'checking' && bootState !== 'complete';
  const dashboardReady =
    isDeepLink || (bootState !== 'checking' && bootState !== 'booting');

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
          initialProjectId={initialProjectId}
        />
      </main>
      {showBoot ? (
        <BootScreen onExiting={handleBootExiting} onComplete={handleBootComplete} />
      ) : null}
    </LazyMotion>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}
