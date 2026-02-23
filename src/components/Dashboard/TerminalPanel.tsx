'use client';

import { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { dashboardPanelIn } from '@/lib/animations';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BentoIcon } from '@/components/BentoOS/BentoIcon';

interface ChatFns {
  send: (content: string) => void;
  addAssistant: (content: string) => void;
  clear: () => void;
}

interface TerminalPanelProps {
  Chatbot: ComponentType<{
    onReady?: (fns: ChatFns) => void;
    onViewResume?: () => void;
    onSeeProjects?: () => void;
  }>;
  onChatReady: (fns: ChatFns) => void;
  onClearChat: () => void;
  onViewResume: () => void;
  onSeeProjects: () => void;
}

function BentoHeaderIcon() {
  return <BentoIcon size={16} />;
}

export function TerminalPanel({
  Chatbot,
  onChatReady,
  onClearChat,
  onViewResume,
  onSeeProjects,
}: TerminalPanelProps) {
  return (
    <motion.div
      className="glass-panel rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0"
      variants={dashboardPanelIn}
    >
      <SectionHeader
        title="terminal"
        icon={<BentoHeaderIcon />}
        iconColor="orange"
        subtitle="anon@bentOS"
        mono
        action={
          <button
            onClick={onClearChat}
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
            onViewResume={onViewResume}
            onSeeProjects={onSeeProjects}
          />
        </ErrorBoundary>
      </div>
    </motion.div>
  );
}
