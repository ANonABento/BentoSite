'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useCallback, useRef, useEffect, Component, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import Header from '@/components/Header';
import { tabContent, buttonTap } from '@/lib/animations';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import {
  KeyboardShortcutsModal,
  useKeyboardShortcutsHelp,
} from '@/components/ui/KeyboardShortcutsHelp';
import { SectionHeader } from '@/components/ui/SectionHeader';
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
            <div className="w-16 h-16 mx-auto mb-4 text-[var(--status-error)]">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Something went wrong</h3>
            <p className="text-[var(--text-secondary)] text-sm mb-4">This component failed to load.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-[var(--interactive)] hover:bg-[var(--interactive-hover)] active:bg-[var(--interactive-active)] text-[var(--text-on-accent)] rounded-lg text-sm transition-colors"
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
          <div className="w-12 h-12 border-2 border-[var(--purple-muted)] border-t-[var(--interactive)] rounded-full animate-spin" />
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
        <div className="w-12 h-12 border-2 border-[var(--purple-muted)] border-t-[var(--interactive)] rounded-full animate-spin" />
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
function LandingOverlay({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="relative z-10 text-center px-4">
      {/* Name/Title */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mb-8"
      >
        <h1 className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] mb-4 drop-shadow-2xl">
          {PORTFOLIO_DATA.personal.name}
        </h1>
        <p className="text-xl md:text-2xl text-[var(--text-secondary)] drop-shadow-lg">
          {PORTFOLIO_DATA.personal.title}
        </p>
      </motion.div>

      {/* CTA Button */}
      <motion.button
        onClick={onEnter}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5, type: 'spring' }}
        whileHover={{
          scale: 1.05,
          boxShadow: '0 0 40px rgba(167, 139, 250, 0.5)'
        }}
        whileTap={{ scale: 0.95 }}
        className="px-8 py-4 bg-[var(--interactive)] backdrop-blur-sm text-[var(--text-on-accent)] rounded-2xl text-lg font-medium
          border border-[var(--purple-muted)] shadow-lg shadow-[0_0_20px_var(--purple-muted)]
          hover:bg-[var(--interactive-hover)] transition-colors duration-300"
      >
        <span className="flex items-center gap-3">
          <span className="text-2xl">👋</span>
          Say Hi
        </span>
      </motion.button>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL-based landing state - check both URL param and local override
  const urlView = searchParams.get('view');
  const [hasClickedEnter, setHasClickedEnter] = useState(false);
  // Landing = URL is NOT dashboard AND user has NOT clicked enter
  const isLanding = urlView !== 'dashboard' && !hasClickedEnter;

  const [activeSection, setActiveSection] = useState<'3d' | 'chat'>('3d');
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [chatFns, setChatFns] = useState<{ send: (content: string) => void; clear: () => void } | null>(null);
  const { isOpen: isShortcutsOpen, close: closeShortcuts } = useKeyboardShortcutsHelp();

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
    // Update local state immediately for smooth transition
    setHasClickedEnter(true);
    // Update URL for persistence (using replace to avoid history bloat)
    router.replace('/?view=dashboard', { scroll: false });
  }, [router]);

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
    <LayoutGroup>
      <main className="relative h-screen bg-[var(--background)] overflow-hidden">
        {/* Vignette overlay for landing */}
        <AnimatePresence>
          {isLanding && (
            <motion.div
              className="fixed inset-0 pointer-events-none z-40"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Landing overlay - name/title/button */}
        <AnimatePresence>
          {isLanding && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="pointer-events-auto">
                <LandingOverlay onEnter={handleEnterSite} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main layout container */}
        <div className="flex flex-col h-screen">
          {/* Header - only rendered when not landing */}
          <AnimatePresence>
            {!isLanding && (
              <motion.div
                className="flex-shrink-0 p-4 md:p-6"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Toggle Tabs - only rendered when not landing */}
          <AnimatePresence>
            {!isLanding && (
              <motion.div
                className="md:hidden flex-shrink-0 px-4 pb-4"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
            <div className="glass rounded-2xl p-1.5 flex gap-1">
              <motion.button
                onClick={() => setActiveSection('3d')}
                whileTap={buttonTap}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeSection === '3d'
                    ? 'bg-[var(--interactive)] text-[var(--text-on-accent)] shadow-lg shadow-[0_0_20px_var(--purple-muted)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                  3D Viewer
                </span>
              </motion.button>
              <motion.button
                onClick={() => setActiveSection('chat')}
                whileTap={buttonTap}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeSection === 'chat'
                    ? 'bg-[var(--interactive)] text-[var(--text-on-accent)] shadow-lg shadow-[0_0_20px_var(--purple-muted)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Servant
                </span>
              </motion.button>
            </div>
          </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col md:flex-row gap-5 px-4 pb-4 md:px-6 md:pb-6 min-h-0">
            {/* 3D Viewer Section - Desktop: shrinks from fullscreen to 50% */}
            <motion.div
              layout
              className={`hidden md:flex flex-col min-h-0 ${
                isLanding ? 'fixed inset-0 z-30' : 'md:w-1/2'
              }`}
              transition={{
                layout: { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
              }}
            >
              <motion.div
                layout
                className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
                  isLanding ? '' : 'glass rounded-2xl'
                }`}
                transition={{
                  layout: { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
                }}
              >
                {/* Viewfinder Header - fades in after landing (only when no project selected) */}
                {!selectedProject && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={isLanding ? { opacity: 0, height: 0 } : { opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <SectionHeader
                      title="Viewfinder"
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      }
                      iconColor="orange"
                      subtitle="view images, videos, 3D models, websites"
                    />
                  </motion.div>
                )}
                {/* Viewfinder Content */}
                <div className="flex-1 min-h-0">
                  <ErrorBoundary>
                    <Viewfinder project={selectedProject} minimal={isLanding} />
                  </ErrorBoundary>
                </div>
              </motion.div>
            </motion.div>

            {/* Mobile: 3D Viewer goes fullscreen in landing, then into tab */}
            <motion.div
              layout
              className={`md:hidden ${
                isLanding
                  ? 'fixed inset-0 z-30'
                  : activeSection === '3d' ? 'flex flex-col min-h-0 flex-1' : 'hidden'
              }`}
              transition={{
                layout: { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
              }}
            >
              <motion.div
                layout
                className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
                  isLanding ? '' : 'glass rounded-2xl'
                }`}
                transition={{
                  layout: { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
                }}
              >
                {/* Mobile Viewfinder Header */}
                {!selectedProject && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={isLanding ? { opacity: 0, height: 0 } : { opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <SectionHeader
                      title="Viewfinder"
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      }
                      iconColor="orange"
                      subtitle="view images, videos, 3D models, websites"
                    />
                  </motion.div>
                )}
                <div className="flex-1 min-h-0">
                  <ErrorBoundary>
                    <Viewfinder project={selectedProject} minimal={isLanding} />
                  </ErrorBoundary>
                </div>
              </motion.div>
            </motion.div>

            {/* Mobile Chat Tab Content */}
            <AnimatePresence mode="wait">
              {!isLanding && activeSection === 'chat' && (
                <motion.div
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
                    <SectionHeader
                      title="Servant"
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      }
                      iconColor="violet"
                      action={
                        <button
                          onClick={() => chatFns?.clear()}
                          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1 rounded hover:bg-[var(--glass-bg)]"
                        >
                          Clear
                        </button>
                      }
                    />
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right Column: Skills + Chat - Desktop: slides in from right */}
            <motion.div
              className="hidden md:flex md:w-1/2 flex-col gap-5 min-h-0"
              initial={{ x: 100, opacity: 0 }}
              animate={isLanding ? { x: 100, opacity: 0 } : { x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Skills Section */}
              <div className="glass rounded-2xl overflow-hidden flex-shrink-0">
                <SkillsSection onAskAI={handleAskAboutSkill} />
              </div>

              {/* Servant */}
              <div className="glass rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                <SectionHeader
                  title="Servant"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  }
                  iconColor="violet"
                  action={
                    <button
                      onClick={() => chatFns?.clear()}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1 rounded hover:bg-[var(--glass-bg)]"
                    >
                      Clear
                    </button>
                  }
                />
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
            </motion.div>
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
  );
}

// Loading fallback for Suspense
function HomeLoading() {
  return (
    <main className="relative h-screen bg-[var(--background)] overflow-hidden flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[var(--purple-muted)] border-t-[var(--interactive)] rounded-full animate-spin" />
        <span className="text-[var(--text-secondary)] text-sm">Loading...</span>
      </div>
    </main>
  );
}

// Wrapper component with Suspense for useSearchParams
export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}
