'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, Component, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import { fadeInUp, tabContent, defaultViewport, buttonTap } from '@/lib/animations';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import {
  KeyboardShortcutsModal,
  useKeyboardShortcutsHelp,
} from '@/components/ui/KeyboardShortcutsHelp';

const LandingScene = dynamic(() => import('@/components/Landing/LandingScene'), {
  ssr: false,
});

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

const ThreeViewer = dynamic(() => import('@/components/Dimension/Dimension'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
        <span className="text-[var(--text-secondary)] text-sm">Loading 3D Viewer...</span>
      </div>
    </div>
  ),
});

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

export default function Home() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeSection, setActiveSection] = useState<'3d' | 'chat'>('3d');
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [chatFns, setChatFns] = useState<{ send: (content: string) => void; clear: () => void } | null>(null);
  const { isOpen: isShortcutsOpen, close: closeShortcuts } = useKeyboardShortcutsHelp();

  const handleEnterSite = useCallback(() => {
    setShowLanding(false);
  }, []);

  const handleAskAboutSkill = useCallback((skill: string) => {
    const message = `Tell me about your experience with ${skill}`;

    if (activeSection !== 'chat') {
      setActiveSection('chat');
      setTimeout(() => {
        chatFns?.send(message);
      }, 150);
    } else {
      chatFns?.send(message);
    }
  }, [chatFns, activeSection]);

  return (
    <>
      {/* Landing Page Overlay */}
      <AnimatePresence>
        {showLanding && (
          <LandingScene onEnter={handleEnterSite} />
        )}
      </AnimatePresence>

      {/* Main Content - Bento Layout */}
      <motion.div
        id="main-content"
        className="flex flex-col h-screen bg-[var(--background)] bg-grid overflow-hidden transition-colors duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: showLanding ? 0 : 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
      {/* Header */}
      <motion.div
        className="flex-shrink-0 p-4 md:p-6"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
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

      {/* Mobile Toggle Tabs */}
      <div className="md:hidden flex-shrink-0 px-4 pb-4">
        <div className="glass rounded-2xl p-1.5 flex gap-1">
          <motion.button
            onClick={() => setActiveSection('3d')}
            whileTap={buttonTap}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
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
          </motion.button>
          <motion.button
            onClick={() => setActiveSection('chat')}
            whileTap={buttonTap}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
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
          </motion.button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-5 px-4 pb-4 md:px-6 md:pb-6 min-h-0">
        {/* 3D Viewer Section - Desktop */}
        <div className="hidden md:flex md:w-1/2 flex-col min-h-0">
          <motion.div
            className="glass rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0"
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            variants={fadeInUp}
          >
            {/* 3D Viewer Header */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--orange)] animate-pulse" />
              <span className="text-sm font-medium text-[var(--text-secondary)]">Interactive 3D Viewer</span>
            </div>
            {/* 3D Canvas */}
            <div className="flex-1 min-h-0">
              <ErrorBoundary>
                <ThreeViewer />
              </ErrorBoundary>
            </div>
          </motion.div>
        </div>

        {/* Mobile Content with AnimatePresence */}
        <AnimatePresence mode="wait">
          {activeSection === '3d' && (
            <motion.div
              key="3d-mobile"
              className="md:hidden flex flex-col min-h-0 flex-1"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={tabContent}
            >
              <div className="glass rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--orange)] animate-pulse" />
                  <span className="text-sm font-medium text-[var(--text-secondary)]">Interactive 3D Viewer</span>
                </div>
                <div className="flex-1 min-h-0">
                  <ErrorBoundary>
                    <ThreeViewer />
                  </ErrorBoundary>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'chat' && (
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Column: Skills + Chat - Desktop */}
        <motion.div
          className="hidden md:flex md:w-1/2 flex-col gap-5 min-h-0"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={fadeInUp}
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
        </motion.div>
      </div>

      {/* Projects Modal */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        onLoad3DModel={() => {
          setIsProjectsOpen(false);
        }}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={closeShortcuts} />
      </motion.div>
    </>
  );
}
