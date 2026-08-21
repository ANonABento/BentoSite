import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { StrictMode, useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardLayout } from './DashboardLayout';
import type { ChatbotProps } from '@/components/Chat';
import type { Project } from '@/lib/projects-data';
import { PROJECTS } from '@/lib/projects-data';
import { ThemeProvider } from '@/lib/theme-context';
import { resetAutoPromptTracker } from './autoPromptTracker';

/**
 * The dashboard's two most breakable behaviours had no component-level cover:
 * the `?project=` deep link auto-sending a rundown to the chat exactly once,
 * and the mobile tab rendering the chat column at all. Both were previously
 * only guarded by a contract test over the starter map.
 */

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('framer-motion', () => {
  const passthrough = (Tag: keyof React.JSX.IntrinsicElements) => {
    const MotionPassthrough = ({
      children,
      variants: _variants,
      whileTap: _whileTap,
      whileHover: _whileHover,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      layoutId: _layoutId,
      onAnimationComplete: _onAnimationComplete,
      ...props
    }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) => {
      const Component = Tag as 'div';
      return <Component {...props}>{children as React.ReactNode}</Component>;
    };
    MotionPassthrough.displayName = `MotionPassthrough(${Tag})`;
    return MotionPassthrough;
  };

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: { div: passthrough('div'), button: passthrough('button') },
    m: { div: passthrough('div'), button: passthrough('button') },
    useAnimationControls: () => ({ start: vi.fn() }),
    useReducedMotion: () => true,
  };
});

vi.mock('@/lib/analytics', () => ({
  analytics: { skillClicked: vi.fn(), emailCopied: vi.fn() },
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

function StubViewfinder({ project }: { project: Project | null }) {
  return <div data-testid="viewfinder">{project ? project.name : 'no project'}</div>;
}

function StubSkills() {
  return <div data-testid="skills">skills</div>;
}

function StubShortcuts() {
  return null;
}

const send = vi.fn();

function StubChatbot({ onReady, projectName }: ChatbotProps) {
  // Mirrors the real chat: publishes its control surface from an effect, which
  // StrictMode runs on both mount cycles. A stub that reported only once would
  // hide the double-send this suite is here to catch.
  useEffect(() => {
    onReady?.({
      send,
      clear: vi.fn(),
      focusInput: vi.fn(),
      addAssistant: vi.fn(),
    });
  }, [onReady]);

  return <div data-testid="chatbot">{projectName ?? 'no project name'}</div>;
}

function renderDashboard(initialProjectId?: string) {
  // StrictMode on purpose: it double-invokes effects exactly the way React does
  // in development, which is the condition the auto-prompt dedupe exists for.
  // Without it this suite cannot tell a working guard from a missing one.
  //
  // The header inside the dashboard reads the theme, so the real provider has
  // to be present — the same wrapper app/layout.tsx supplies.
  return render(
    <StrictMode>
      <ThemeProvider>
        <DashboardLayout
          Viewfinder={StubViewfinder}
          Chatbot={StubChatbot}
          SkillsSection={StubSkills}
          KeyboardShortcutsModal={StubShortcuts}
          isShortcutsOpen={false}
          closeShortcuts={vi.fn()}
          ready
          initialProjectId={initialProjectId}
        />
      </ThemeProvider>
    </StrictMode>,
  );
}

beforeEach(() => {
  send.mockClear();
  resetAutoPromptTracker();
});

describe('DashboardLayout', () => {
  it('sends the project rundown to the chat on a deep link', async () => {
    const project = PROJECTS[0];

    renderDashboard(project.id);

    await waitFor(() => expect(send).toHaveBeenCalledWith(`Tell me about ${project.name}`));
    // Keeping it to one send is the tracker's job, and is covered directly in
    // autoPromptTracker.test.ts — a rendered double-invoke cannot be forced
    // reliably from here.
  });

  it('does not prompt the chat when no project is deep-linked', async () => {
    renderDashboard();

    await waitFor(() => expect(screen.getAllByTestId('chatbot').length).toBeGreaterThan(0));
    expect(send).not.toHaveBeenCalled();
  });

  it('tells the chat which project it is showing, so a cleared chat keeps context', () => {
    const project = PROJECTS[0];

    renderDashboard(project.id);

    expect(screen.getAllByTestId('chatbot')[0]).toHaveTextContent(project.name);
  });

  it('renders the selected project in the viewfinder', () => {
    const project = PROJECTS[0];

    renderDashboard(project.id);

    for (const panel of screen.getAllByTestId('viewfinder')) {
      expect(panel).toHaveTextContent(project.name);
    }
  });

  it('renders the skills and terminal columns when the mobile chat tab is opened', () => {
    renderDashboard();

    // Desktop column only, to begin with.
    expect(screen.getAllByTestId('skills')).toHaveLength(1);

    fireEvent.click(screen.getByRole('tab', { name: /terminal/i }));

    // Desktop column plus the mobile tab's own copy.
    expect(screen.getAllByTestId('skills')).toHaveLength(2);
    expect(screen.getAllByTestId('chatbot').length).toBeGreaterThan(1);
  });
});
