'use client';

import type { ChatFunctions, ChatbotProps } from '@/components/Chat';
import { motion } from 'framer-motion';
import { dashboardBottomIn } from '@/lib/animations';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SectionHeader } from '@/components/ui/SectionHeader';

// Terminal/command prompt icon
const TerminalIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

interface TerminalPanelProps {
  Chatbot: React.ComponentType<ChatbotProps>;
  onChatReady: (fns: ChatFunctions) => void;
  onClearChat: () => void;
  onUserMessage?: () => void;
  /** Project the dashboard is showing, so a cleared chat keeps its context. */
  projectName?: string;
}

export function TerminalPanel({
  Chatbot,
  onChatReady,
  onClearChat,
  onUserMessage,
  projectName,
}: TerminalPanelProps) {
  return (
    <motion.div
      className="glass-panel dashboard-panel overflow-hidden flex-1 flex flex-col min-h-0 bento-corner-all md:rounded-none md:bento-corner-br"
      style={{ borderColor: 'var(--purple-muted)', ['--panel-accent' as string]: 'var(--purple)' }}
      variants={dashboardBottomIn}
    >
      <SectionHeader
        title="terminal"
        icon={TerminalIcon}
        iconColor="violet"
        subtitle="anon@bentOS"
        mono
        action={
          <button
            onClick={onClearChat}
            aria-label="Clear chat conversation"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-2 py-1 rounded hover:bg-[var(--glass-bg)]"
          >
            Clear
          </button>
        }
      />
      <div className="flex-1 min-h-0">
        <ErrorBoundary>
          <Chatbot
            onReady={onChatReady}
            onUserMessage={onUserMessage}
            projectName={projectName}
          />
        </ErrorBoundary>
      </div>
    </motion.div>
  );
}
