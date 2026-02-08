'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useRef, useEffect, Component, ReactNode } from 'react';
import { m, AnimatePresence, LayoutGroup, LazyMotion, domAnimation, useReducedMotion } from 'framer-motion';
import Header from '@/components/Header';
import { tabContent, buttonTap } from '@/lib/animations';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import {
  KeyboardShortcutsModal,
  useKeyboardShortcutsHelp,
} from '@/components/ui/KeyboardShortcutsHelp';
import type { Project } from '@/lib/projects-data';

// Error Boundary for graceful error handling
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="w-full h-full flex items-center justify-center glass backdrop-blur-sm rounded-2xl">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Something went wrong</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-4">This component failed to load.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-violet-500 hover:bg-violet-400 active:bg-violet-600 text-white rounded-lg text-sm transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Viewfinder = dynamic(
  () => import('@/components/Viewfinder').then((mod) => ({ default: mod.Viewfinder })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
          <span className="text-[var(--text-secondary)] text-sm">Loading Viewfinder...</span>
        </div>
      </div>
    ),
  }
);

const Chatbot = dynamic(() => import('@/components/Chat'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <span className="text-[var(--text-secondary)] text-sm">Loading...</span>
      </div>
    </div>
  ),
});

const ProjectsModal = dynamic(
  () => import('@/components/Projects/ProjectsModal').then((mod) => mod.ProjectsModal),
  { ssr: false }
);

const SkillsSection = dynamic(
  () => import('@/components/Skills/SkillsSection'),
  { ssr: false }
);

// Landing overlay component (name/title/button only - no 3D viewer)
function LandingOverlay({ onEnter, reducedMotion }: { onEnter: () => void; reducedMotion: boolean | null }) {
  const instantTransition = { duration: 0 };

  return (
    <div className="relative z-10 text-center px-4">
      {/* Name/Title */}
      <m.div
        initial={reducedMotion ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? instantTransition : { delay: 0.5, duration: 0.8 }}
        className="mb-8"
      >
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-2xl">
          {PORTFOLIO_DATA.personal.name}
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 drop-shadow-lg">
          {PORTFOLIO_DATA.personal.title}
        </p>
      </m.div>

      {/* CTA Button */}
      <m.button
        onClick={onEnter}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reducedMotion ? instantTransition : { delay: 1, duration: 0.5, type: 'spring' }}
        whileHover={reducedMotion ? undefined : {
          scale: 1.05,
          boxShadow: '0 0 40px rgba(167, 139, 250, 0.5)'
        }}
        whileTap={reducedMotion ? undefined : { scale: 0.95 }}
        className="px-8 py-4 bg-violet-500/90 backdrop-blur-sm text-white rounded-2xl text-lg font-medium
          border border-violet-400/30 shadow-lg shadow-violet-500/30
          hover:bg-violet-400/90 transition-colors duration-300"
      >
        <span className="flex items-center gap-3">
          <span className="text-2xl">👋</span>
          Say Hi
        </span>
      </m.button>
    </div>
  );
}

export default function Home() {
  const [isLanding, setIsLanding] = useState(true);
  const [activeSection, setActiveSection] = useState<'3d' | 'chat'>('3d');
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [chatFns, setChatFns] = useState<{ send: (content: string) => void; clear: () => void } | null>(null);
  const { isOpen: isShortcutsOpen, close: closeShortcuts } = useKeyboardShortcutsHelp();
  const prefersReducedMotion = useReducedMotion();

  // Instant transition for reduced motion preference
  const instantTransition = { duration: 0 };
  // Standard layout transition - use as const for proper typing
  const layoutTransition = prefersReducedMotion
    ? instantTransition
    : { duration: 0.7, ease: [0.4, 0, 0.2, 1] as const };

  // Track mounted state to prevent state updates on unmounted components
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSelectProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsProjectsOpen(false);
    // On mobile, switch to viewfinder tab
    setActiveSection('3d');
  }, []);

  const handleEnterSite = useCallback(() => {
    setIsLanding(false);
  }, []);

  const handleAskAboutSkill = useCallback((skill: string) => {
    const message = `Tell me about your experience with ${skill}`;

    if (activeSection !== 'chat') {
      setActiveSection('chat');
      setTimeout(() => {
        if (isMountedRef.current) {
          chatFns?.send(message);
        }
      }, 150);
    } else {
      chatFns?.send(message);
    }
  }, [chatFns, activeSection]);

  return (
    <LazyMotion features={domAnimation} strict>
    <LayoutGroup>
      <main id="main-content" className="relative h-screen bg-[var(--background)] overflow-hidden">
        {/* Vignette overlay for landing */}
        <AnimatePresence>
          {isLanding && (
            <m.div
              className="fixed inset-0 pointer-events-none z-40"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={prefersReducedMotion ? instantTransition : { duration: 0.5 }}
              style={{
                background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Landing overlay - name/title/button */}
        <AnimatePresence>
          {isLanding && (
            <m.div
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
              exit={{ opacity: 0 }}
              transition={prefersReducedMotion ? instantTransition : { duration: 0.3 }}
            >
              <div className="pointer-events-auto">
                <LandingOverlay onEnter={handleEnterSite} reducedMotion={prefersReducedMotion} />
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Main layout container */}
        <div className="flex flex-col h-screen">
          {/* Header - slides down */}
          <m.div
            className="flex-shrink-0 p-4 md:p-6"
            initial={prefersReducedMotion ? false : { y: -100, opacity: 0 }}
            animate={isLanding ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }}
            transition={prefersReducedMotion ? instantTransition : { delay: 0.2, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
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
          </m.div>

          {/* Mobile Toggle Tabs - slides down */}
          <m.div
            className="md:hidden flex-shrink-0 px-4 pb-4"
            initial={prefersReducedMotion ? false : { y: -50, opacity: 0 }}
            animate={isLanding ? { y: -50, opacity: 0 } : { y: 0, opacity: 1 }}
            transition={prefersReducedMotion ? instantTransition : { delay: 0.3, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="glass rounded-2xl p-1.5 flex gap-1">
              <m.button
                onClick={() => setActiveSection('3d')}
                whileTap={buttonTap}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 focus-ring ${
                  activeSection === '3d'
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                  3D Viewer
                </span>
              </m.button>
              <m.button
                onClick={() => setActiveSection('chat')}
                whileTap={buttonTap}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 focus-ring ${
                  activeSection === 'chat'
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Servant
                </span>
              </m.button>
            </div>
          </m.div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col md:flex-row gap-5 px-4 pb-4 md:px-6 md:pb-6 min-h-0">
            {/* 3D Viewer Section - Desktop: shrinks from fullscreen to 50% */}
            <m.div
              layout
              className={`hidden md:flex flex-col min-h-0 ${
                isLanding
                  ? 'fixed inset-0 z-30'
                  : 'md:w-1/2'
              }`}
              transition={{ layout: layoutTransition }}
            >
              <m.div
                layout
                className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
                  isLanding ? '' : 'glass rounded-2xl'
                }`}
                transition={{ layout: layoutTransition }}
              >
                {/* Viewfinder Header - fades in after landing (only when no project selected) */}
                {!selectedProject && (
                  <m.div
                    className="flex-shrink-0 px-5 py-4 border-b border-[var(--border)] flex items-center gap-2"
                    initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                    animate={isLanding ? { opacity: 0, height: 0 } : { opacity: 1, height: 'auto' }}
                    transition={prefersReducedMotion ? instantTransition : { delay: 0.5, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[var(--orange)] animate-pulse" />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Viewfinder</span>
                  </m.div>
                )}
                {/* Viewfinder Content */}
                <div className="flex-1 min-h-0">
                  <ErrorBoundary>
                    <Viewfinder project={selectedProject} minimal={isLanding} />
                  </ErrorBoundary>
                </div>
              </m.div>
            </m.div>

            {/* Mobile: 3D Viewer goes fullscreen in landing, then into tab */}
            <m.div
              layout
              className={`md:hidden ${
                isLanding
                  ? 'fixed inset-0 z-30'
                  : activeSection === '3d' ? 'flex flex-col min-h-0 flex-1' : 'hidden'
              }`}
              transition={{ layout: layoutTransition }}
            >
              <m.div
                layout
                className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
                  isLanding ? '' : 'glass rounded-2xl'
                }`}
                transition={{ layout: layoutTransition }}
              >
                {/* Mobile Viewfinder Header */}
                {!selectedProject && (
                  <m.div
                    className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] flex items-center gap-2"
                    initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                    animate={isLanding ? { opacity: 0, height: 0 } : { opacity: 1, height: 'auto' }}
                    transition={prefersReducedMotion ? instantTransition : { delay: 0.5, duration: 0.3 }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[var(--orange)] animate-pulse" />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Viewfinder</span>
                  </m.div>
                )}
                <div className="flex-1 min-h-0">
                  <ErrorBoundary>
                    <Viewfinder project={selectedProject} minimal={isLanding} />
                  </ErrorBoundary>
                </div>
              </m.div>
            </m.div>

            {/* Mobile Chat Tab Content */}
            <AnimatePresence mode="wait">
              {!isLanding && activeSection === 'chat' && (
                <m.div
                  key="chat-mobile"
                  className="md:hidden flex flex-col gap-4 min-h-0 flex-1"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={tabContent}
                >
                  {/* Skills Section */}
                  <div className="glass rounded-2xl overflow-hidden flex-shrink-0">
                    <SkillsSection onAskAI={handleAskAboutSkill} />
                  </div>
                  {/* Servant */}
                  <div className="glass rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                        <span className="text-sm font-medium text-[var(--text-secondary)]">Servant</span>
                      </div>
                      <button
                        onClick={() => chatFns?.clear()}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1 rounded hover:bg-[var(--glass-bg)]"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex-1 min-h-0">
                      <ErrorBoundary>
                        <Chatbot
                          onReady={(fns) => setChatFns(fns)}
                          onViewResume={() => window.open('/resume.pdf', '_blank')}
                          onSeeProjects={() => setIsProjectsOpen(true)}
                        />
                      </ErrorBoundary>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            {/* Right Column: Skills + Chat - Desktop: slides in from right */}
            <m.div
              className="hidden md:flex md:w-1/2 flex-col gap-5 min-h-0"
              initial={prefersReducedMotion ? false : { x: 100, opacity: 0 }}
              animate={isLanding ? { x: 100, opacity: 0 } : { x: 0, opacity: 1 }}
              transition={prefersReducedMotion ? instantTransition : { delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Skills Section */}
              <div className="glass rounded-2xl overflow-hidden flex-shrink-0">
                <SkillsSection onAskAI={handleAskAboutSkill} />
              </div>

              {/* Servant */}
              <div className="glass rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                {/* Chat Header */}
                <div className="flex-shrink-0 px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Servant</span>
                  </div>
                  <button
                    onClick={() => chatFns?.clear()}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1 rounded hover:bg-[var(--glass-bg)]"
                  >
                    Clear
                  </button>
                </div>
                {/* Chat Content */}
                <div className="flex-1 min-h-0">
                  <ErrorBoundary>
                    <Chatbot
                      onReady={(fns) => setChatFns(fns)}
                      onViewResume={() => window.open('/resume.pdf', '_blank')}
                      onSeeProjects={() => setIsProjectsOpen(true)}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </m.div>
          </div>
        </div>

        {/* Projects Modal */}
        <ProjectsModal
          isOpen={isProjectsOpen}
          onClose={() => setIsProjectsOpen(false)}
          onSelectProject={handleSelectProject}
        />

        {/* Keyboard Shortcuts Help Modal */}
        <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={closeShortcuts} />
      </main>
    </LayoutGroup>
    </LazyMotion>
  );
}
