'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useCallback, Component, ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import { AboutSection } from '../components/About/AboutSection';
import { TimelineSection } from '../components/Timeline/TimelineSection';
import { FeaturedProjects } from '../components/Projects/FeaturedProjects';
// Testimonials section removed - no placeholder content
import { sectionStagger, sectionItem } from '@/lib/animations';
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

const ThreeViewer = dynamic(() => import('../components/Dimension/Dimension'), {
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

const Chatbot = dynamic(() => import('../components/Chat'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    </div>
  ),
});

const ProjectsModal = dynamic(
  () => import('../components/Projects/ProjectsModal').then((mod) => mod.ProjectsModal),
  { ssr: false }
);

const SkillsSection = dynamic(
  () => import('../components/Skills/SkillsSection'),
  { ssr: false }
);

export default function Home() {
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatFns, setChatFns] = useState<{ send: (content: string) => void; clear: () => void } | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const handleAskAboutSkill = useCallback((skill: string) => {
    const message = `Tell me about your experience with ${skill}`;
    setIsChatOpen(true);
    setTimeout(() => {
      chatFns?.send(message);
    }, 300);
  }, [chatFns]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="main-content" className="min-h-screen bg-[var(--background)] bg-grid transition-colors duration-300">
      {/* Fixed Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-white/5"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
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
        </div>
      </motion.header>

      {/* Hero Section with 3D Viewer */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 min-h-[80vh] flex items-center">
        <motion.div
          className="max-w-7xl mx-auto px-4 md:px-6 w-full"
          initial="hidden"
          animate="visible"
          variants={sectionStagger}
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Hero Text */}
            <motion.div variants={sectionItem} className="space-y-6">
              <div className="space-y-2">
                <motion.p
                  className="text-violet-400 font-medium flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  UWaterloo Computer Engineering
                </motion.p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  I build
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-orange-400">
                    {' '}robots{' '}
                  </span>
                  that think
                </h1>
              </div>
              <p className="text-lg text-gray-400 max-w-lg">
                Robotics engineer specializing in embedded systems, AI integration, and
                human-robot interaction. From PCB design to GPU-accelerated pipelines.
              </p>
              <div className="flex flex-wrap gap-4">
                <motion.button
                  onClick={() => scrollToSection('projects')}
                  className="px-6 py-3 bg-violet-500 hover:bg-violet-400 text-white rounded-xl font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View My Robots
                </motion.button>
                <motion.button
                  onClick={() => setIsChatOpen(true)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ask Me Anything
                </motion.button>
              </div>
            </motion.div>

            {/* 3D Viewer */}
            <motion.div
              variants={sectionItem}
              className="h-[400px] md:h-[500px] glass rounded-2xl overflow-hidden"
            >
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  <span className="text-sm text-gray-400">Interactive 3D Viewer</span>
                </div>
                <div className="flex-1">
                  <ErrorBoundary>
                    <ThreeViewer />
                  </ErrorBoundary>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="hidden md:flex justify-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <motion.button
              onClick={() => scrollToSection('about')}
              className="flex flex-col items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-sm">Scroll to explore</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* About Section */}
      <AboutSection />

      {/* Featured Projects */}
      <FeaturedProjects onViewAll={() => setIsProjectsOpen(true)} />

      {/* Experience Timeline */}
      <TimelineSection />

      {/* Skills Section */}
      <section id="skills" className="py-16 md:py-24">
        <motion.div
          className="max-w-6xl mx-auto px-4 md:px-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={sectionStagger}
        >
          <motion.div variants={sectionItem} className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Skills & Technologies
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-violet-500 to-orange-500 rounded-full" />
          </motion.div>
          <motion.div variants={sectionItem} className="glass rounded-2xl overflow-hidden">
            <SkillsSection onAskAI={handleAskAboutSkill} />
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center space-y-4">
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} {PORTFOLIO_DATA.personal.name}. Built with Next.js, Three.js, and passion.
          </p>
          <Link
            href="/classic"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-violet-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Try Classic Bento Layout
          </Link>
        </div>
      </footer>

      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-violet-500 hover:bg-violet-400 rounded-full shadow-lg shadow-violet-500/30 flex items-center justify-center text-white transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        {isChatOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            ref={chatRef}
            className="fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] glass rounded-2xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-sm font-medium text-white">AI Assistant</span>
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
                    onSeeProjects={() => {
                      setIsProjectsOpen(true);
                      setIsChatOpen(false);
                    }}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects Modal */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        onLoad3DModel={(modelPath) => {
          setIsProjectsOpen(false);
          console.log('Load 3D model:', modelPath);
        }}
      />
    </div>
  );
}
