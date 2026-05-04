'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { LazyMotion, domAnimation, useReducedMotion } from 'framer-motion';
import {
  KeyboardShortcutsModal,
  useKeyboardShortcutsHelp,
} from '@/components/ui/KeyboardShortcutsHelp';
import {
  AboutSectionSkeleton,
  ProjectsSectionSkeleton,
  SkillsSkeleton,
  TimelineSectionSkeleton,
} from '@/components/ui/Skeleton';
import { LazyPanelFallback, ScrollReveal } from '@/components/ui';
import type { ChatFunctions } from '@/components/Chat';
import { RESUME_URL } from '@/lib/constants';
import { ChatPanel } from './layout-parts/ChatPanel';
import { HeroSection } from './layout-parts/HeroSection';
import { ScrollableFooter } from './layout-parts/ScrollableFooter';
import { ScrollToTopButton } from './layout-parts/ScrollToTopButton';
import { SkillsSectionWrapper } from './layout-parts/SkillsSectionWrapper';
import { useScrollableLayout } from './hooks/useScrollableLayout';

const AboutSection = dynamic(
  () => import('@/components/About/AboutSection').then((mod) => mod.AboutSection),
  { loading: () => <AboutSectionSkeleton /> }
);

const TimelineSection = dynamic(
  () => import('@/components/Timeline/TimelineSection').then((mod) => mod.TimelineSection),
  { loading: () => <TimelineSectionSkeleton /> }
);

const FeaturedProjects = dynamic(
  () => import('@/components/Projects/FeaturedProjects').then((mod) => mod.FeaturedProjects),
  { loading: () => <ProjectsSectionSkeleton /> }
);

const ThreeViewer = dynamic(() => import('@/components/Dimension'), {
  ssr: false,
  loading: () => (
    <LazyPanelFallback
      label="Loading 3D Viewer..."
      spinnerSize="lg"
      spinnerVariant="purple"
    />
  ),
});

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

const ProjectsModal = dynamic(
  () => import('@/components/Projects/ProjectsModal').then((mod) => mod.ProjectsModal),
  { ssr: false }
);

const SkillsSection = dynamic(
  () => import('@/components/Skills/SkillsSection'),
  { ssr: false, loading: () => <SkillsSkeleton /> }
);

type ChatPanelFunctions = Pick<ChatFunctions, 'send' | 'clear'>;

export default function ScrollableLayout() {
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatFns, setChatFns] = useState<ChatPanelFunctions | null>(null);
  const pendingChatMessageRef = useRef<string | null>(null);
  const {
    scrollToSection,
    scrollToTop,
    showScrollTop,
    isMountedRef,
  } = useScrollableLayout();
  const { isOpen: isShortcutsOpen, close: closeShortcuts } = useKeyboardShortcutsHelp();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const instantTransition = { duration: 0 };

  const handleAskAboutSkill = useCallback(
    (skill: string) => {
      const message = `Tell me about your experience with ${skill}`;
      setIsChatOpen(true);

      if (chatFns) {
        chatFns.send(message);
        return;
      }

      pendingChatMessageRef.current = message;
    },
    [chatFns]
  );

  const handleChatReady = useCallback(
    (fns: ChatFunctions) => {
      const nextChatFns = { send: fns.send, clear: fns.clear };
      setChatFns(nextChatFns);

      if (!pendingChatMessageRef.current || !isMountedRef.current) {
        return;
      }

      nextChatFns.send(pendingChatMessageRef.current);
      pendingChatMessageRef.current = null;
    },
    [isMountedRef]
  );

  const handleViewResume = useCallback(() => {
    window.open(RESUME_URL, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <LazyMotion features={domAnimation} strict>
      <main
        id="main-content"
        className="min-h-screen bg-[var(--background)] bg-grid transition-colors duration-300"
      >
        <HeroSection
          ThreeViewer={ThreeViewer}
          instantTransition={instantTransition}
          onOpenChat={() => setIsChatOpen(true)}
          onScrollToAbout={() => scrollToSection('about')}
          onViewRobots={() => scrollToSection('projects')}
          prefersReducedMotion={prefersReducedMotion}
        />

        <ScrollReveal>
          <AboutSection />
        </ScrollReveal>
        <ScrollReveal delay={0.04}>
          <FeaturedProjects onViewAll={() => setIsProjectsOpen(true)} />
        </ScrollReveal>
        <ScrollReveal delay={0.04}>
          <TimelineSection />
        </ScrollReveal>

        <ScrollReveal delay={0.04}>
          <SkillsSectionWrapper
            SkillsSection={SkillsSection}
            instantTransition={instantTransition}
            onAskAboutSkill={handleAskAboutSkill}
            prefersReducedMotion={prefersReducedMotion}
          />
        </ScrollReveal>

        <ScrollableFooter onScrollToSection={scrollToSection} />

        <ScrollToTopButton
          visible={showScrollTop && !isChatOpen}
          onClick={scrollToTop}
          prefersReducedMotion={prefersReducedMotion}
        />

        <ChatPanel
          Chatbot={Chatbot}
          instantTransition={instantTransition}
          isOpen={isChatOpen}
          prefersReducedMotion={prefersReducedMotion}
          onChatReady={handleChatReady}
          onClearChat={() => chatFns?.clear()}
          onSeeProjects={() => {
            setIsProjectsOpen(true);
            setIsChatOpen(false);
          }}
          onToggle={() => setIsChatOpen((open) => !open)}
          onViewResume={handleViewResume}
        />

        <ProjectsModal isOpen={isProjectsOpen} onClose={() => setIsProjectsOpen(false)} />
        <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={closeShortcuts} />
      </main>
    </LazyMotion>
  );
}
