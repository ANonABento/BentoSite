import type { ProjectCategory, ProjectStatus } from '@/lib/projects-data';

export const PROJECT_CATEGORY_THEMES: Record<
  ProjectCategory,
  {
    accent: string;
    muted: string;
    icon: string;
    gradient: string;
  }
> = {
  Robotics: {
    accent: 'var(--purple)',
    muted: 'var(--purple-muted)',
    icon: '🦾',
    gradient: 'linear-gradient(135deg, rgba(167, 139, 250, 0.28), rgba(12, 12, 20, 0.82))',
  },
  'AI & Robotics': {
    accent: 'var(--orange)',
    muted: 'var(--orange-muted)',
    icon: '🤖',
    gradient: 'linear-gradient(135deg, rgba(224, 123, 60, 0.28), rgba(167, 139, 250, 0.2))',
  },
  Hardware: {
    accent: 'var(--status-warning)',
    muted: 'var(--status-warning-muted)',
    icon: '🔧',
    gradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.24), rgba(12, 12, 20, 0.82))',
  },
  Software: {
    accent: 'var(--status-info)',
    muted: 'var(--status-info-muted)',
    icon: '💻',
    gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.24), rgba(12, 12, 20, 0.82))',
  },
  'VR/AR': {
    accent: 'var(--status-info)',
    muted: 'var(--status-info-muted)',
    icon: '🥽',
    gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.24), rgba(167, 139, 250, 0.16))',
  },
  Competition: {
    accent: 'var(--orange)',
    muted: 'var(--orange-muted)',
    icon: '🏆',
    gradient: 'linear-gradient(135deg, rgba(224, 123, 60, 0.24), rgba(12, 12, 20, 0.82))',
  },
  Accessibility: {
    accent: 'var(--status-success)',
    muted: 'var(--status-success-muted)',
    icon: '♿',
    gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.24), rgba(12, 12, 20, 0.82))',
  },
  Games: {
    accent: 'var(--status-error)',
    muted: 'var(--status-error-muted)',
    icon: '🎮',
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.24), rgba(167, 139, 250, 0.16))',
  },
};

export const PROJECT_STATUS_COPY: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  Completed: {
    label: 'Ready',
    className:
      'bg-[var(--status-success-muted)] text-[var(--status-success)] border border-[var(--status-success)]/30',
  },
  'In Progress': {
    label: 'Building',
    className:
      'bg-[var(--status-warning-muted)] text-[var(--status-warning)] border border-[var(--status-warning)]/30',
  },
  Archived: {
    label: 'Archive',
    className: 'bg-[var(--glass-bg)] text-[var(--text-muted)] border border-[var(--border)]',
  },
};
