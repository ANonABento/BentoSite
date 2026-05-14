'use client';

import { useState, useCallback, useRef, useEffect, useMemo, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, m } from 'framer-motion';
import {
  dashboardStagger,
  dashboardRightIn,
  tabContent,
} from '@/lib/animations';
import Header from '@/components/Header';
import { RESUME_URL } from '@/lib/constants';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { ViewfinderPanel } from './ViewfinderPanel';
import { TerminalPanel } from './TerminalPanel';
import { MobileTabs } from './MobileTabs';
import type { ChatFunctions, ChatbotProps } from '@/components/Chat';
import type { Project } from '@/lib/projects-data';
import { getProjectById } from '@/lib/projects-data';

interface DashboardLayoutProps {
  Viewfinder: ComponentType<{ project: Project | null; minimal?: boolean; suspended?: boolean }>;
  Chatbot: ComponentType<ChatbotProps>;
  SkillsSection: ComponentType<{
    onAskAI?: (skill: string) => void;
    isExpanded?: boolean;
    onExpandedChange?: (next: boolean) => void;
    selectedProject?: Project | null;
  }>;
  KeyboardShortcutsModal: ComponentType<{ isOpen: boolean; onClose: () => void }>;
  isShortcutsOpen: boolean;
  closeShortcuts: () => void;
  /** Controls when the stagger entrance begins (set after boot exit) */
  ready: boolean;
  /** Initial project ID to load from URL */
  initialProjectId?: string;
}

export function DashboardLayout({
  Viewfinder,
  Chatbot,
  SkillsSection,
  KeyboardShortcutsModal,
  isShortcutsOpen,
  closeShortcuts,
  ready,
  initialProjectId,
}: DashboardLayoutProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'3d' | 'chat'>('3d');
  // Derive (don't `useState`) so we react when `initialProjectId` changes after
  // hydration — useSyncExternalStore in the parent returns undefined on SSR
  // and the real value on the client, and `useState(init)` would lock in the
  // SSR value forever.
  const selectedProject = useMemo<Project | null>(
    () => (initialProjectId ? getProjectById(initialProjectId) ?? null : null),
    [initialProjectId],
  );
  const [chatFns, setChatFns] = useState<ChatFunctions | null>(null);
  const [skillsExpanded, setSkillsExpanded] = useState(true);
  const hasAutoCollapsedRef = useRef(false);
  const isMountedRef = useRef(true);
  const mobileChatRef = useRef<HTMLDivElement>(null);
  const pendingChatMessageRef = useRef<string | null>(null);
  // Tracks the project id we've already auto-prompted the chat about so we
  // don't re-send the rundown on re-render or after the user clears the chat.
  const projectPromptSentForRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleClearChat = useCallback(() => {
    chatFns?.clear();
    chatFns?.focusInput();
    hasAutoCollapsedRef.current = false;
    setSkillsExpanded(true);
  }, [chatFns]);

  const handleUserMessage = useCallback(() => {
    if (hasAutoCollapsedRef.current) return;
    hasAutoCollapsedRef.current = true;
    setSkillsExpanded(false);
  }, []);

  const handleSkillsExpandedChange = useCallback((next: boolean) => {
    setSkillsExpanded(next);
    if (next) {
      // User re-opened the panel — don't auto-collapse again this session.
      hasAutoCollapsedRef.current = true;
    }
  }, []);

  const handleViewResume = useCallback(() => {
    window.open(RESUME_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const handleSeeProjects = useCallback(() => {
    router.push('/projects');
  }, [router]);

  const handleAskAboutSkill = useCallback((skill: string) => {
    const message = `Tell me about your experience with ${skill}`;
    if (activeSection !== 'chat') {
      setActiveSection('chat');
    }

    if (chatFns) {
      chatFns?.send(message);
      chatFns?.focusInput();
      return;
    }

    pendingChatMessageRef.current = message;
  }, [chatFns, activeSection]);

  const handleChatReady = useCallback((fns: ChatFunctions) => {
    setChatFns(fns);

    if (!pendingChatMessageRef.current || !isMountedRef.current) {
      return;
    }

    fns.send(pendingChatMessageRef.current);
    pendingChatMessageRef.current = null;
    fns.focusInput();
  }, []);

  // On `?project=<id>` deep-link, auto-send the canned "Tell me about <name>"
  // opener once the chat is ready — the /api/chat starter map turns this into
  // a deterministic rundown without burning Gemini quota.
  //
  // We also mark the auto-collapse ref as "used" so the project-tools panel
  // doesn't collapse when this synthetic user-message fires `onUserMessage`.
  // In project mode the tools panel is the whole point; keep it visible.
  useEffect(() => {
    if (!chatFns || !selectedProject) return;
    if (projectPromptSentForRef.current === selectedProject.id) return;
    projectPromptSentForRef.current = selectedProject.id;
    hasAutoCollapsedRef.current = true;
    chatFns.send(`Tell me about ${selectedProject.name}`);
  }, [chatFns, selectedProject]);

  return (
    <>
      <m.div
        className="flex flex-col h-screen overflow-hidden"
        variants={dashboardStagger}
        // No `initial` prop: framer-motion defaults to the animate value, so
        // there is no `visible → hidden` leg at mount during boot. Children
        // inherit the label and animate hidden → visible exactly once when
        // `ready` flips after boot exits.
        animate={ready ? 'visible' : 'hidden'}
      >
        {/* Header — always part of the OS chrome, not an entering panel.
            Kept static (no motion) so it can never wedge at hidden state if
            framer-motion's variant inheritance hiccups during boot exit. */}
        <div className="flex-shrink-0 px-4 pb-3 pt-4 md:px-6 md:pb-4 md:pt-5">
          <Header
            name={PORTFOLIO_DATA.personal.name}
            tagline={PORTFOLIO_DATA.personal.title}
            githubUrl={PORTFOLIO_DATA.personal.github}
            linkedinUrl={PORTFOLIO_DATA.personal.linkedin}
            email={PORTFOLIO_DATA.personal.email}
            resumeUrl={RESUME_URL}
            compact
            onProjectsClick={handleSeeProjects}
          />
        </div>

        {/* Mobile Tabs */}
        <MobileTabs activeSection={activeSection} onTabChange={setActiveSection} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 px-4 pb-4 md:px-6 md:pb-6 min-h-0">
          {/* Desktop Viewfinder */}
          <ViewfinderPanel
            selectedProject={selectedProject}
            Viewfinder={Viewfinder}
          />

          {/* Mobile Viewfinder (3d tab) */}
          <ViewfinderPanel
            selectedProject={selectedProject}
            Viewfinder={Viewfinder}
            mobileHidden={activeSection !== '3d'}
          />

          {/* Mobile Chat Tab */}
          <AnimatePresence mode="wait">
            {activeSection === 'chat' && (
              <m.div
                ref={mobileChatRef}
                key="chat-mobile"
                className="md:hidden flex flex-col gap-4 min-h-0 flex-1"
                variants={tabContent}
                initial="initial"
                animate="animate"
                exit="exit"
                onAnimationComplete={(variant) => {
                  // Clear residual transform after enter so backdrop-filter
                  // works on glass-panel children
                  if (variant === 'animate' && mobileChatRef.current) {
                    mobileChatRef.current.style.transform = 'none';
                  }
                }}
              >
                <div className="glass-panel dashboard-panel overflow-hidden flex-shrink-0 bento-corner-all">
                  <SkillsSection
                    onAskAI={handleAskAboutSkill}
                    isExpanded={skillsExpanded}
                    onExpandedChange={handleSkillsExpandedChange}
                    selectedProject={selectedProject}
                  />
                </div>
                <TerminalPanel
                  Chatbot={Chatbot}
                  onChatReady={handleChatReady}
                  onClearChat={handleClearChat}
                  onViewResume={handleViewResume}
                  onSeeProjects={handleSeeProjects}
                  onUserMessage={handleUserMessage}
                />
              </m.div>
            )}
          </AnimatePresence>

          {/* Desktop Right Column — no m.div wrapper here; an ancestor
              with a residual CSS transform breaks backdrop-filter on glass-panel
              children.  Each child animates independently instead. */}
          <div className="hidden md:flex md:w-1/2 flex-col gap-5 min-h-0">
            {/* Skills Section */}
            <m.div
              className="glass-panel dashboard-panel overflow-hidden flex-shrink-0 bento-corner-tr"
              variants={dashboardRightIn}
            >
              <SkillsSection
                onAskAI={handleAskAboutSkill}
                isExpanded={skillsExpanded}
                onExpandedChange={handleSkillsExpandedChange}
                selectedProject={selectedProject}
              />
            </m.div>

            {/* Terminal */}
            <TerminalPanel
              Chatbot={Chatbot}
              onChatReady={handleChatReady}
              onClearChat={handleClearChat}
              onViewResume={handleViewResume}
              onSeeProjects={handleSeeProjects}
              onUserMessage={handleUserMessage}
            />
          </div>
        </div>
      </m.div>

      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={closeShortcuts} />
    </>
  );
}
