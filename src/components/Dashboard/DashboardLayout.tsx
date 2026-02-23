'use client';

import { useState, useCallback, useRef, useEffect, ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  dashboardStagger,
  dashboardHeaderIn,
  dashboardRightIn,
  tabContent,
} from '@/lib/animations';
import Header from '@/components/Header';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { ViewfinderPanel } from './ViewfinderPanel';
import { TerminalPanel } from './TerminalPanel';
import { MobileTabs } from './MobileTabs';
import type { Project } from '@/lib/projects-data';

interface DashboardLayoutProps {
  Viewfinder: ComponentType<{ project: Project | null; minimal?: boolean }>;
  Chatbot: ComponentType<{
    onReady?: (fns: { send: (content: string) => void; addAssistant: (content: string) => void; clear: () => void }) => void;
    onViewResume?: () => void;
    onSeeProjects?: () => void;
  }>;
  SkillsSection: ComponentType<{ onAskAI?: (skill: string) => void }>;
  ProjectsModal: ComponentType<{
    isOpen: boolean;
    onClose: () => void;
    onSelectProject?: (p: Project) => void;
  }>;
  KeyboardShortcutsModal: ComponentType<{ isOpen: boolean; onClose: () => void }>;
  isShortcutsOpen: boolean;
  closeShortcuts: () => void;
  /** Controls when the stagger entrance begins (set after boot exit) */
  ready: boolean;
}

export function DashboardLayout({
  Viewfinder,
  Chatbot,
  SkillsSection,
  ProjectsModal,
  KeyboardShortcutsModal,
  isShortcutsOpen,
  closeShortcuts,
  ready,
}: DashboardLayoutProps) {
  const [activeSection, setActiveSection] = useState<'3d' | 'chat'>('3d');
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [chatFns, setChatFns] = useState<{
    send: (content: string) => void;
    addAssistant: (content: string) => void;
    clear: () => void;
  } | null>(null);
  const isMountedRef = useRef(true);
  const mobileChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSelectProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsProjectsOpen(false);
    setActiveSection('3d');
  }, []);

  const handleAskAboutSkill = useCallback((skill: string) => {
    const message = `Tell me about your experience with ${skill}`;
    if (activeSection !== 'chat') {
      setActiveSection('chat');
      setTimeout(() => {
        if (isMountedRef.current) chatFns?.send(message);
      }, 150);
    } else {
      chatFns?.send(message);
    }
  }, [chatFns, activeSection]);

  return (
    <>
      <motion.div
        className="flex flex-col h-screen"
        variants={dashboardStagger}
        initial="hidden"
        animate={ready ? 'visible' : 'hidden'}
      >
        {/* Header — drops from top */}
        <motion.div className="flex-shrink-0 p-4 md:p-6" variants={dashboardHeaderIn}>
          <Header
            name={PORTFOLIO_DATA.personal.name}
            tagline={PORTFOLIO_DATA.personal.title}
            githubUrl={PORTFOLIO_DATA.personal.github}
            linkedinUrl={PORTFOLIO_DATA.personal.linkedin}
            email={PORTFOLIO_DATA.personal.email}
            resumeUrl="/resume.pdf"
            compact
            onProjectsClick={() => setIsProjectsOpen(true)}
          />
        </motion.div>

        {/* Mobile Tabs */}
        <MobileTabs activeSection={activeSection} onTabChange={setActiveSection} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row gap-5 px-4 pb-4 md:px-6 md:pb-6 min-h-0">
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
              <motion.div
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
                <div className="glass-panel rounded-2xl overflow-hidden flex-shrink-0">
                  <SkillsSection onAskAI={handleAskAboutSkill} />
                </div>
                <TerminalPanel
                  Chatbot={Chatbot}
                  onChatReady={(fns) => setChatFns(fns)}
                  onClearChat={() => chatFns?.clear()}
                  onViewResume={() => window.open('/resume.pdf', '_blank')}
                  onSeeProjects={() => setIsProjectsOpen(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Right Column — no motion.div wrapper here; an ancestor
              with a residual CSS transform breaks backdrop-filter on glass-panel
              children.  Each child animates independently instead. */}
          <div className="hidden md:flex md:w-1/2 flex-col gap-5 min-h-0">
            {/* Skills Section */}
            <motion.div
              className="glass-panel rounded-2xl overflow-hidden flex-shrink-0"
              variants={dashboardRightIn}
            >
              <SkillsSection onAskAI={handleAskAboutSkill} />
            </motion.div>

            {/* Terminal */}
            <TerminalPanel
              Chatbot={Chatbot}
              onChatReady={(fns) => setChatFns(fns)}
              onClearChat={() => chatFns?.clear()}
              onViewResume={() => window.open('/resume.pdf', '_blank')}
              onSeeProjects={() => setIsProjectsOpen(true)}
            />
          </div>
        </div>
      </motion.div>

      {/* Modals (outside stagger container) */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        onSelectProject={handleSelectProject}
      />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={closeShortcuts} />
    </>
  );
}
