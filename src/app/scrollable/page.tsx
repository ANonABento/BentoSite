'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useRef } from 'react';
import { m, AnimatePresence, LazyMotion, domAnimation, useReducedMotion } from 'framer-motion';
import Header from '../../components/Header';
import { sectionStagger, sectionItem } from '@/lib/animations';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import {
  AboutSectionSkeleton,
  TimelineSectionSkeleton,
  ProjectsSectionSkeleton,
  SkillsSkeleton,
} from '@/components/ui/Skeleton';
import {
  KeyboardShortcutsModal,
  useKeyboardShortcutsHelp,
} from '@/components/ui/KeyboardShortcutsHelp';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Dynamically import sections with loading skeletons for better perceived performance
const AboutSection = dynamic(
  () => import('../../components/About/AboutSection').then((mod) => mod.AboutSection),
  { loading: () => <AboutSectionSkeleton /> }
);

const TimelineSection = dynamic(
  () => import('../../components/Timeline/TimelineSection').then((mod) => mod.TimelineSection),
  { loading: () => <TimelineSectionSkeleton /> }
);

const FeaturedProjects = dynamic(
  () => import('../../components/Projects/FeaturedProjects').then((mod) => mod.FeaturedProjects),
  { loading: () => <ProjectsSectionSkeleton /> }
);

const ThreeViewer = dynamic(() => import('../../components/Dimension/Dimension'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[var(--purple-muted)] border-t-[var(--interactive)] rounded-full animate-spin" />
        <span className="text-[var(--text-secondary)] text-sm">Loading 3D Viewer...</span>
      </div>
    </div>
  ),
});

const Chatbot = dynamic(() => import('../../components/Chat'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[var(--purple-muted)] border-t-[var(--interactive)] rounded-full animate-spin" />
      </div>
    </div>
  ),
});

const ProjectsModal = dynamic(
  () => import('../../components/Projects/ProjectsModal').then((mod) => mod.ProjectsModal),
  { ssr: false }
);

const SkillsSection = dynamic(
  () => import('../../components/Skills/SkillsSection'),
  { ssr: false, loading: () => <SkillsSkeleton /> }
);

export default function ScrollableLayout() {
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatFns, setChatFns] = useState<{ send: (content: string) => void; clear: () => void } | null>(null);
  const pendingChatMessageRef = useRef<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const { isOpen: isShortcutsOpen, close: closeShortcuts } = useKeyboardShortcutsHelp();
  const prefersReducedMotion = useReducedMotion();

  // Instant transition for reduced motion preference
  const instantTransition = { duration: 0 };

  // Track mounted state to prevent state updates on unmounted components
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Track scroll position for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAskAboutSkill = useCallback((skill: string) => {
    const message = `Tell me about your experience with ${skill}`;
    setIsChatOpen(true);
    if (chatFns) {
      chatFns.send(message);
      return;
    }

    pendingChatMessageRef.current = message;
  }, [chatFns]);

  useEffect(() => {
    const pendingChatMessage = pendingChatMessageRef.current;
    if (!pendingChatMessage || !chatFns || !isMountedRef.current) return;

    chatFns.send(pendingChatMessage);
    pendingChatMessageRef.current = null;
  }, [chatFns]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <LazyMotion features={domAnimation} strict>
    <main id="main-content" className="min-h-screen bg-[var(--background)] bg-grid transition-colors duration-300">
      {/* Fixed Header */}
      <m.header
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]"
        initial={prefersReducedMotion ? false : { y: -100 }}
        animate={{ y: 0 }}
        transition={prefersReducedMotion ? instantTransition : { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
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
      </m.header>

      {/* Hero Section with 3D Viewer */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 min-h-[80vh] flex items-center">
        <m.div
          className="max-w-7xl mx-auto px-4 md:px-6 w-full"
          initial="hidden"
          animate="visible"
          variants={sectionStagger}
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Hero Text */}
            <m.div variants={sectionItem} className="space-y-6">
              <div className="space-y-2">
                <m.p
                  className="text-[var(--interactive)] font-medium flex items-center gap-2"
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={prefersReducedMotion ? instantTransition : { delay: 0.2 }}
                >
                  <span className="inline-block w-2 h-2 bg-[var(--status-success)] rounded-full animate-pulse" />
                  UWaterloo Computer Engineering
                </m.p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] leading-tight">
                  I build
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, var(--purple), var(--orange))' }}>
                    {' '}robots{' '}
                  </span>
                  that think
                </h1>
              </div>
              <p className="text-lg text-[var(--text-secondary)] max-w-lg">
                Robotics engineer specializing in embedded systems, AI integration, and
                human-robot interaction. From PCB design to GPU-accelerated pipelines.
              </p>
              <div className="flex flex-wrap gap-4">
                <m.button
                  onClick={() => scrollToSection('projects')}
                  className="px-6 py-3 bg-[var(--interactive)] hover:bg-[var(--interactive-hover)] text-[var(--text-on-accent)] rounded-xl font-medium transition-colors"
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                >
                  View My Robots
                </m.button>
                <m.button
                  onClick={() => setIsChatOpen(true)}
                  className="px-6 py-3 bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-strong)] text-[var(--text-primary)] rounded-xl font-medium transition-colors border border-[var(--border)]"
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                >
                  Ask Me Anything
                </m.button>
              </div>
            </m.div>

            {/* 3D Viewer */}
            <m.div
              variants={sectionItem}
              className="min-h-[300px] h-[50vh] max-h-[500px] glass rounded-2xl overflow-hidden"
            >
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--orange)] animate-pulse" />
                  <span className="text-sm text-[var(--text-secondary)]">Interactive 3D Viewer</span>
                </div>
                <div className="flex-1">
                  <ErrorBoundary>
                    <ThreeViewer />
                  </ErrorBoundary>
                </div>
              </div>
            </m.div>
          </div>

          {/* Scroll indicator */}
          <m.div
            className="hidden md:flex justify-center mt-12"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={prefersReducedMotion ? instantTransition : { delay: 1 }}
          >
            <m.button
              onClick={() => scrollToSection('about')}
              className="flex flex-col items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              animate={prefersReducedMotion ? undefined : { y: [0, 8, 0] }}
              transition={prefersReducedMotion ? instantTransition : { duration: 2, repeat: Infinity }}
              aria-label="Scroll down to about section"
            >
              <span className="text-sm">Scroll to explore</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </m.button>
          </m.div>
        </m.div>
      </section>

      {/* About Section */}
      <AboutSection />

      {/* Featured Projects */}
      <FeaturedProjects onViewAll={() => setIsProjectsOpen(true)} />

      {/* Experience Timeline */}
      <TimelineSection />

      {/* Skills Section */}
      <section id="skills" className="py-16 md:py-24">
        <m.div
          className="max-w-6xl mx-auto px-4 md:px-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={sectionStagger}
        >
          <m.div variants={sectionItem} className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Skills & Technologies
            </h2>
            <div className="w-20 h-1 rounded-full" style={{ background: 'linear-gradient(to right, var(--purple), var(--orange))' }} />
          </m.div>
          <m.div variants={sectionItem} className="glass rounded-2xl overflow-hidden">
            <SkillsSection onAskAI={handleAskAboutSkill} />
          </m.div>
        </m.div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{PORTFOLIO_DATA.personal.name}</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {PORTFOLIO_DATA.personal.title} at {PORTFOLIO_DATA.personal.university}
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Quick Links</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => scrollToSection('about')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--interactive)] transition-colors text-left">About</button>
                <button onClick={() => scrollToSection('projects')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--interactive)] transition-colors text-left">Projects</button>
                <button onClick={() => scrollToSection('experience')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--interactive)] transition-colors text-left">Experience</button>
                <button onClick={() => scrollToSection('skills')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--interactive)] transition-colors text-left">Skills</button>
              </div>
            </div>

            {/* Connect */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Connect</h4>
              <div className="flex gap-4">
                <a href={PORTFOLIO_DATA.personal.github} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label="GitHub">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                </a>
                <a href={PORTFOLIO_DATA.personal.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href={`mailto:${PORTFOLIO_DATA.personal.email}`} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label="Email">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[var(--text-muted)]">
              &copy; {new Date().getFullYear()} {PORTFOLIO_DATA.personal.name}. Built with Next.js & Three.js
            </p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && !isChatOpen && (
          <m.button
            onClick={scrollToTop}
            className="fixed bottom-6 left-4 sm:left-6 z-40 w-12 h-12 bg-[var(--glass-bg-strong)] hover:bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--border)] rounded-full shadow-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            aria-label="Scroll to top"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </m.button>
        )}
      </AnimatePresence>

      {/* Floating Chat Button */}
      <m.button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-4 sm:right-6 z-40 w-14 h-14 bg-[var(--interactive)] hover:bg-[var(--interactive-hover)] rounded-full shadow-lg shadow-[0_0_20px_var(--purple-muted)] flex items-center justify-center text-[var(--text-on-accent)] transition-colors"
        whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
        initial={prefersReducedMotion ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={prefersReducedMotion ? instantTransition : { delay: 0.5, type: 'spring' }}
        aria-label={isChatOpen ? 'Close chat' : 'Open AI chat assistant'}
        aria-expanded={isChatOpen}
      >
        {isChatOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </m.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <m.div
            ref={chatRef}
            className="fixed bottom-24 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[380px] h-[60vh] sm:h-[500px] max-h-[calc(100vh-8rem)] glass rounded-2xl overflow-hidden shadow-2xl"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            transition={prefersReducedMotion ? instantTransition : { type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="h-full flex flex-col">
              <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--interactive)] animate-pulse" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Servant</span>
                </div>
                <button
                  onClick={() => chatFns?.clear()}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
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
          </m.div>
        )}
      </AnimatePresence>

      {/* Projects Modal */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
      />

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={closeShortcuts} />
    </main>
    </LazyMotion>
  );
}
