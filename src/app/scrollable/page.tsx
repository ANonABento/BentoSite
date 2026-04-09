'use client';

import { LazyMotion, domAnimation, useReducedMotion } from 'framer-motion';
import {
  KeyboardShortcutsModal,
  useKeyboardShortcutsHelp,
} from '@/components/ui/KeyboardShortcutsHelp';
import { ScrollableFloatingUi } from './_components/ScrollableFloatingUi';
import { ScrollableFooter } from './_components/ScrollableFooter';
import { ScrollableHero } from './_components/ScrollableHero';
import { ScrollableSkillsSection } from './_components/ScrollableSkillsSection';
import {
  AboutSection,
  Chatbot,
  FeaturedProjects,
  ProjectsModal,
  SkillsSection,
  ThreeViewer,
  TimelineSection,
} from './_components/dynamic-components';
import { useScrollablePageState } from './_components/useScrollablePageState';

export default function ScrollableLayout() {
  const {
    chatFns,
    chatRef,
    handleChatReady,
    handleAskAboutSkill,
    isChatOpen,
    isProjectsOpen,
    scrollToSection,
    scrollToTop,
    setIsChatOpen,
    setIsProjectsOpen,
    showScrollTop,
  } = useScrollablePageState();
  const { isOpen: isShortcutsOpen, close: closeShortcuts } = useKeyboardShortcutsHelp();
  const prefersReducedMotion = useReducedMotion() ?? false;
  const instantTransition = { duration: 0 };

  return (
    <LazyMotion features={domAnimation} strict>
      <main
        id="main-content"
        className="min-h-screen bg-[var(--background)] bg-grid transition-colors duration-300"
      >
        <ScrollableHero
          ThreeViewer={ThreeViewer}
          instantTransition={instantTransition}
          onOpenChat={() => setIsChatOpen(true)}
          onOpenProjects={() => setIsProjectsOpen(true)}
          prefersReducedMotion={prefersReducedMotion}
          scrollToSection={scrollToSection}
        />

        <AboutSection />
        <FeaturedProjects onViewAll={() => setIsProjectsOpen(true)} />
        <TimelineSection />

        <ScrollableSkillsSection
          SkillsSection={SkillsSection}
          instantTransition={instantTransition}
          onAskAboutSkill={handleAskAboutSkill}
          prefersReducedMotion={prefersReducedMotion}
        />

        <ScrollableFooter scrollToSection={scrollToSection} />

        <ScrollableFloatingUi
          Chatbot={Chatbot}
          KeyboardShortcutsModal={KeyboardShortcutsModal}
          ProjectsModal={ProjectsModal}
          chatFns={chatFns}
          chatRef={chatRef}
          closeShortcuts={closeShortcuts}
          instantTransition={instantTransition}
          isChatOpen={isChatOpen}
          isProjectsOpen={isProjectsOpen}
          isShortcutsOpen={isShortcutsOpen}
          prefersReducedMotion={prefersReducedMotion}
          scrollToTop={scrollToTop}
          setChatFns={handleChatReady}
          setIsChatOpen={setIsChatOpen}
          setIsProjectsOpen={setIsProjectsOpen}
          showScrollTop={showScrollTop}
        />
      </main>
    </LazyMotion>
  );
}
