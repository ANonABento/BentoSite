import { render, screen } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SkillsSection } from './SkillsSection';
import type { Project } from '@/lib/projects-data';

vi.mock('framer-motion', () => {
  const passthrough = (Tag: keyof React.JSX.IntrinsicElements) => {
    const MotionPassthrough = ({
      children,
      variants: _variants,
      whileTap: _whileTap,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...props
    }: React.HTMLAttributes<HTMLElement> & {
      variants?: unknown;
      whileTap?: unknown;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
    }) => {
      const Component = Tag as 'div';
      return <Component {...props}>{children}</Component>;
    };
    MotionPassthrough.displayName = `MotionPassthrough(${Tag})`;
    return MotionPassthrough;
  };

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    m: {
      div: passthrough('div'),
      button: passthrough('button'),
    },
  };
});

vi.mock('@/lib/analytics', () => ({
  analytics: { skillClicked: vi.fn() },
}));

describe('SkillsSection', () => {
  it('renders the generic three-category view when no project is selected', () => {
    render(<SkillsSection />);

    expect(screen.getByText(/^skills$/i)).toBeInTheDocument();
    expect(screen.getByText(/> click to learn more/)).toBeInTheDocument();
    expect(screen.getByText('HW_MODULES')).toBeInTheDocument();
    expect(screen.getByText('SW_STACK')).toBeInTheDocument();
    expect(screen.getByText('DEV_TOOLS')).toBeInTheDocument();
  });

  it('switches to project tools mode when a project is provided', () => {
    const project: Project = {
      id: 'robotic-arm-puppeteer',
      name: 'Robotic Arm Puppeteer',
      shortDescription: 'short',
      category: 'Robotics',
      status: 'Completed',
      technologies: ['Python', 'ROS2', 'Dynamixel', 'Fusion 360', 'MuJoCo'],
      links: {},
    };

    render(<SkillsSection selectedProject={project} />);

    // Header re-skins
    expect(screen.getByText(/project tools/i)).toBeInTheDocument();
    expect(screen.getByText('> robotic-arm-puppeteer')).toBeInTheDocument();

    // Generic categories are gone
    expect(screen.queryByText('HW_MODULES')).not.toBeInTheDocument();
    expect(screen.queryByText('SW_STACK')).not.toBeInTheDocument();
    expect(screen.queryByText('DEV_TOOLS')).not.toBeInTheDocument();

    // Project-mode buckets are present and contain the project's tech
    expect(screen.getByText('HARDWARE')).toBeInTheDocument();
    expect(screen.getByText('STACK')).toBeInTheDocument();
    expect(screen.getByText('TOOLING')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Ask AI about Python/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ask AI about Dynamixel/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ask AI about Fusion 360/ })).toBeInTheDocument();
  });

  it('falls back to the generic view if a project has no categorizable tech', () => {
    const project: Project = {
      id: 'empty',
      name: 'Empty',
      shortDescription: 'short',
      category: 'Software',
      status: 'Completed',
      technologies: [],
      links: {},
    };

    render(<SkillsSection selectedProject={project} />);

    expect(screen.getByText(/^skills$/i)).toBeInTheDocument();
    expect(screen.getByText('HW_MODULES')).toBeInTheDocument();
  });
});
