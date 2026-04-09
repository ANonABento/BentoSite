'use client';

import { ComponentType, RefObject } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ErrorBoundary } from '@/components/ui';
import { ChatFunctions } from '@/components/Chat/chat.types';

type ChatPanelFunctions = Pick<ChatFunctions, 'send' | 'clear'>;

interface ScrollableFloatingUiProps {
  Chatbot: ComponentType<{
    onReady?: (fns: ChatFunctions) => void;
    onViewResume?: () => void;
    onSeeProjects?: () => void;
  }>;
  KeyboardShortcutsModal: ComponentType<{ isOpen: boolean; onClose: () => void }>;
  ProjectsModal: ComponentType<{ isOpen: boolean; onClose: () => void }>;
  chatFns: ChatPanelFunctions | null;
  chatRef: RefObject<HTMLDivElement | null>;
  closeShortcuts: () => void;
  instantTransition: { duration: number };
  isChatOpen: boolean;
  isProjectsOpen: boolean;
  isShortcutsOpen: boolean;
  prefersReducedMotion: boolean;
  scrollToTop: () => void;
  setChatFns: (fns: ChatPanelFunctions | null) => void;
  setIsChatOpen: (open: boolean) => void;
  setIsProjectsOpen: (open: boolean) => void;
  showScrollTop: boolean;
}

export function ScrollableFloatingUi({
  Chatbot,
  KeyboardShortcutsModal,
  ProjectsModal,
  chatFns,
  chatRef,
  closeShortcuts,
  instantTransition,
  isChatOpen,
  isProjectsOpen,
  isShortcutsOpen,
  prefersReducedMotion,
  scrollToTop,
  setChatFns,
  setIsChatOpen,
  setIsProjectsOpen,
  showScrollTop,
}: ScrollableFloatingUiProps) {
  return (
    <>
      <AnimatePresence>
        {showScrollTop && !isChatOpen ? (
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
        ) : null}
      </AnimatePresence>

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

      <AnimatePresence>
        {isChatOpen ? (
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
                    onReady={(fns) => setChatFns({ send: fns.send, clear: fns.clear })}
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
        ) : null}
      </AnimatePresence>

      <ProjectsModal isOpen={isProjectsOpen} onClose={() => setIsProjectsOpen(false)} />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={closeShortcuts} />
    </>
  );
}
