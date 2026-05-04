'use client';

import { ComponentType } from 'react';
import { m } from 'framer-motion';
import { sectionItem, sectionStagger } from '@/lib/animations';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { DimensionViewerProps } from '@/components/Dimension/Dimension.types';
import Header from '@/components/Header';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { ScrollableErrorFallback } from './ScrollableErrorFallback';

interface HeroSectionProps {
  ThreeViewer: ComponentType<DimensionViewerProps>;
  instantTransition: { duration: number };
  prefersReducedMotion: boolean;
  onOpenChat: () => void;
  onScrollToAbout: () => void;
  onViewRobots: () => void;
}

export function HeroSection({
  ThreeViewer,
  instantTransition,
  prefersReducedMotion,
  onOpenChat,
  onScrollToAbout,
  onViewRobots,
}: HeroSectionProps) {
  return (
    <>
      <m.header
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]"
        initial={prefersReducedMotion ? false : { y: -100 }}
        animate={{ y: 0 }}
        transition={
          prefersReducedMotion
            ? instantTransition
            : { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
        }
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
          />
        </div>
      </m.header>

      <section className="pt-24 pb-16 md:pt-32 md:pb-24 min-h-[80vh] flex items-center">
      <m.div
        className="max-w-7xl mx-auto px-4 md:px-6 w-full"
        initial="hidden"
        animate="visible"
        variants={sectionStagger}
      >
        <div className="grid lg:grid-cols-2 gap-8 items-center">
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
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--purple), var(--orange))' }}
                >
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
                onClick={onViewRobots}
                className="px-6 py-3 bg-[var(--interactive)] hover:bg-[var(--interactive-hover)] text-[var(--text-on-accent)] rounded-xl font-medium transition-colors"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              >
                View My Robots
              </m.button>
              <m.button
                onClick={onOpenChat}
                className="px-6 py-3 bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-strong)] text-[var(--text-primary)] rounded-xl font-medium transition-colors border border-[var(--border)]"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              >
                Ask Me Anything
              </m.button>
            </div>
          </m.div>

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
                <ErrorBoundary
                  fallback={({ retry }) => <ScrollableErrorFallback onRetry={retry} />}
                >
                  <ThreeViewer minimal />
                </ErrorBoundary>
              </div>
            </div>
          </m.div>
        </div>

        <m.div
          className="hidden md:flex justify-center mt-12"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={prefersReducedMotion ? instantTransition : { delay: 1 }}
        >
          <m.button
            onClick={onScrollToAbout}
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
    </>
  );
}
