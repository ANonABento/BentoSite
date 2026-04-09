'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LayoutGroup, LazyMotion, domAnimation } from 'framer-motion';
import { BootScreen } from '@/components/BentoOS/BootScreen';
import { BentoIcon } from '@/components/BentoOS/BentoIcon';
import { DashboardLayout } from '@/components/Dashboard';
import {
  KeyboardShortcutsModal,
  useKeyboardShortcutsHelp,
} from '@/components/ui/KeyboardShortcutsHelp';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function ModuleLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <BentoIcon size={32} className="animate-pulse" />
        <span className="text-[var(--text-muted)] text-xs font-mono">loading module...</span>
      </div>
    </div>
  );
}

const Viewfinder = dynamic(
  () => import('@/components/Viewfinder').then((mod) => ({ default: mod.Viewfinder })),
  { ssr: false, loading: ModuleLoader }
);

const Chatbot = dynamic(() => import('@/components/Chat'), {
  ssr: false,
  loading: ModuleLoader,
});

const ProjectsModal = dynamic(
  () => import('@/components/Projects/ProjectsModal').then((mod) => mod.ProjectsModal),
  { ssr: false }
);

const SkillsSection = dynamic(
  () => import('@/components/Skills/SkillsSection'),
  { ssr: false }
);

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlView = searchParams.get('view');
  const isDashboardView = urlView === 'dashboard';
  const [isBooting, setIsBooting] = useState(!isDashboardView);
  const [showDashboard, setShowDashboard] = useState(isDashboardView);
  const [dashboardReady, setDashboardReady] = useState(isDashboardView);
  const { isOpen: isShortcutsOpen, close: closeShortcuts } = useKeyboardShortcutsHelp();
  const dashboardReadyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (dashboardReadyTimeoutRef.current !== null) {
        window.clearTimeout(dashboardReadyTimeoutRef.current);
      }
    };
  }, []);

  // Called when boot exit animation starts — mount dashboard underneath for crossfade
  const handleBootExiting = useCallback(() => {
    router.replace('/?view=dashboard', { scroll: false });
    setShowDashboard(true);
    // Small delay so dashboard mounts first, then stagger entrance begins
    // while boot screen is still fading out (crossfade effect)
    if (dashboardReadyTimeoutRef.current !== null) {
      window.clearTimeout(dashboardReadyTimeoutRef.current);
    }
    dashboardReadyTimeoutRef.current = window.setTimeout(() => {
      setDashboardReady(true);
      dashboardReadyTimeoutRef.current = null;
    }, 100);
  }, [router]);

  // Called when boot exit animation finishes — clean up boot screen from DOM
  const handleBootComplete = useCallback(() => {
    setIsBooting(false);
  }, []);

  return (
    <LazyMotion features={domAnimation}>
    <LayoutGroup>
      <main id="main-content" className="relative h-screen bg-atmosphere overflow-hidden">
        {/* Boot screen overlay — manages its own exit animation */}
        {isBooting && (
          <BootScreen onExiting={handleBootExiting} onComplete={handleBootComplete} />
        )}

        {/* Preload 3D in background during boot */}
        {isBooting && !showDashboard && (
          <div
            className="fixed inset-0 opacity-0 pointer-events-none -z-10"
            aria-hidden="true"
          >
            <Viewfinder project={null} minimal />
          </div>
        )}

        {/* Dashboard — mounts during boot exit for crossfade, animates when ready */}
        {showDashboard && (
          <DashboardLayout
            Viewfinder={Viewfinder}
            Chatbot={Chatbot}
            SkillsSection={SkillsSection}
            ProjectsModal={ProjectsModal}
            KeyboardShortcutsModal={KeyboardShortcutsModal}
            isShortcutsOpen={isShortcutsOpen}
            closeShortcuts={closeShortcuts}
            ready={dashboardReady}
          />
        )}
      </main>
    </LayoutGroup>
    </LazyMotion>
  );
}

function HomeLoading() {
  return (
    <main className="relative h-screen bg-[var(--background)] overflow-hidden flex items-center justify-center">
      <LoadingSpinner size="lg" variant="purple" message="Loading..." />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}
