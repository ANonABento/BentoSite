'use client';

import { ComponentType } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { ChatFunctions, ChatbotProps } from '@/components/Chat';
import { ScrollableErrorFallback } from './ScrollableErrorFallback';

interface ChatPanelProps {
  Chatbot: ComponentType<ChatbotProps>;
  instantTransition: { duration: number };
  isOpen: boolean;
  prefersReducedMotion: boolean;
  onChatReady: (fns: ChatFunctions) => void;
  onClearChat: () => void;
  onSeeProjects: () => void;
  onToggle: () => void;
  onViewResume: () => void;
}

export function ChatPanel({
  Chatbot,
  instantTransition,
  isOpen,
  prefersReducedMotion,
  onChatReady,
  onClearChat,
  onSeeProjects,
  onToggle,
  onViewResume,
}: ChatPanelProps) {
  return (
    <>
      <m.button
        onClick={onToggle}
        className="fixed bottom-6 right-4 sm:right-6 z-40 w-14 h-14 bg-[var(--interactive)] hover:bg-[var(--interactive-hover)] rounded-full shadow-lg shadow-[0_0_20px_var(--purple-muted)] flex items-center justify-center text-[var(--text-on-accent)] transition-colors"
        whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
        initial={prefersReducedMotion ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={prefersReducedMotion ? instantTransition : { delay: 0.5, type: 'spring' }}
        aria-label={isOpen ? 'Close chat' : 'Open AI chat assistant'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
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
        {isOpen && (
          <m.div
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
                  onClick={onClearChat}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <ErrorBoundary
                  fallback={({ retry }) => <ScrollableErrorFallback onRetry={retry} />}
                >
                  <Chatbot
                    onReady={onChatReady}
                    onViewResume={onViewResume}
                    onSeeProjects={onSeeProjects}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
