'use client';

import { useCallback, useEffect, useState } from 'react';
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

export default function Home() {
  const [showBoot, setShowBoot] = useState(true);
  const [dashboardReady, setDashboardReady] = useState(false);
  const { isOpen: isShortcutsOpen, close: closeShortcuts } = useKeyboardShortcutsHelp();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'dashboard') {
      setShowBoot(false);
      setDashboardReady(true);
    }
  }, []);

  const handleBootExiting = useCallback(() => {
    setDashboardReady(true);
  }, []);

  const handleBootComplete = useCallback(() => {
    setShowBoot(false);
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
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
