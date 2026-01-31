'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useCallback, Component, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import { fadeInUp, tabContent, defaultViewport, buttonTap } from '@/lib/animations';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';

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
        <div className="w-full h-full flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm rounded-2xl">
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Something went wrong</h3>
            <p className="text-gray-400 text-sm mb-4">This component failed to load.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-violet-500 hover:bg-violet-400 active:bg-violet-600 text-white rounded-sm text-sm transition-colors"
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
        <span className="text-gray-400 text-sm">Loading 3D Viewer...</span>
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
        <span className="text-gray-400 text-sm">Loading Chat...</span>
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
  const [activeSection, setActiveSection] = useState<'3d' | 'chat'>('3d');
  const [isExpanded3D, setIsExpanded3D] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [chatFns, setChatFns] = useState<{ send: (content: string) => void; clear: () => void } | null>(null);

  const handleAskAboutSkill = useCallback((skill: string) => {
    const message = `Tell me about your experience with ${skill}`;

    // On mobile, switch to chat tab first
    if (activeSection !== 'chat') {
      setActiveSection('chat');
      // Delay message to allow tab animation
      setTimeout(() => {
        chatFns?.send(message);
      }, 150);
    } else {
      chatFns?.send(message);
    }
  }, [chatFns, activeSection]);

  return (
    <div id="main-content" className="flex flex-col h-screen bg-[var(--background)] bg-grid overflow-hidden transition-colors duration-300">
      {/* Layout Switcher */}
      <div className="flex-shrink-0 px-4 pt-2 md:px-6 md:pt-3">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-violet-400 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Switch to Scrollable Layout
        </a>
      </div>

      {/* Header - compact on mobile */}
      <motion.div
        className="flex-shrink-0 p-4 pt-2 md:p-6 md:pt-3"
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
        <div className="glass rounded-2xl p-1 flex">
          <motion.button
            onClick={() => setActiveSection('3d')}
            whileTap={buttonTap}
            className={`flex-1 py-3 px-4 rounded-sm text-sm font-medium transition-all duration-200 ${
              activeSection === '3d'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            3D Viewer
          </motion.button>
          <motion.button
            onClick={() => setActiveSection('chat')}
            whileTap={buttonTap}
            className={`flex-1 py-3 px-4 rounded-sm text-sm font-medium transition-all duration-200 ${
              activeSection === 'chat'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Chat with AI
          </motion.button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 px-4 pb-4 md:px-6 md:pb-6 min-h-0">
        {/* 3D Viewer Section - Desktop always visible, Mobile uses AnimatePresence */}
        <div className="hidden md:flex md:w-1/2 flex-col min-h-0 transition-all duration-300">
          <motion.div
            className="glass rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0"
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            variants={fadeInUp}
          >
            {/* 3D Viewer Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-sm text-gray-400">Interactive 3D Viewer</span>
              </div>
              <button
                onClick={() => setIsExpanded3D(!isExpanded3D)}
                className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
              >
                {isExpanded3D ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    </svg>
                    Collapse
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Expand
                  </>
                )}
              </button>
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
                <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  <span className="text-sm text-gray-400">Interactive 3D Viewer</span>
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
              {/* AI Assistant */}
              <div className="glass rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    <span className="text-sm text-gray-400">AI Assistant</span>
                  </div>
                  <button
                    onClick={() => chatFns?.clear()}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
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

        {/* Right Column: Skills + Chat - Desktop only */}
        <motion.div
          className={`
            hidden md:flex
            ${isExpanded3D ? 'md:w-80' : 'md:w-1/2'}
            flex-col gap-4 min-h-0
            transition-all duration-300
          `}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={fadeInUp}
        >
          {/* Skills Section */}
          <div className="glass rounded-2xl overflow-hidden flex-shrink-0">
            <SkillsSection onAskAI={handleAskAboutSkill} />
          </div>

          {/* AI Assistant */}
          <div className="glass rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0">
            {/* Chat Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-sm text-gray-400">AI Assistant</span>
              </div>
              <button
                onClick={() => chatFns?.clear()}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
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
        onLoad3DModel={(modelPath) => {
          setIsProjectsOpen(false);
          // TODO: Pass modelPath to ThreeViewer when controlled prop is added
          console.log('Load 3D model:', modelPath);
        }}
      />
    </div>
  );
}
