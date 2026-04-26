'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { analytics } from '@/lib/analytics';
import { useTheme } from '@/lib/theme-context';
import { useHasMounted } from '@/lib/use-has-mounted';
import {
  DocumentDownloadIcon,
  MoonIcon,
  SunIcon,
} from '@/components/ui/Icons';

export interface HeaderSocialLink {
  id: 'github' | 'linkedin' | 'email';
  href: string;
  label: string;
  icon: ReactNode;
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const mounted = useHasMounted();

  if (!mounted) {
    return (
      <button
        className="interactive-hover p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg focus-ring"
        aria-label="Toggle theme"
      >
        <SunIcon size={20} />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="interactive-hover p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg focus-ring"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
    </button>
  );
}

export function ResumeButton({
  resumeUrl,
  className = '',
}: {
  resumeUrl: string;
  className?: string;
}) {
  return (
    <a
      href={resumeUrl}
      download
      onClick={() => analytics.resumeDownloaded()}
      aria-label="Download resume"
      className={`interactive-hover flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
        bg-[var(--orange)] hover:bg-[var(--orange-hover)] active:bg-[var(--orange-active)] text-[var(--text-on-accent)]
        hover:shadow-[0_0_20px_var(--orange-muted)] hover:scale-105
        border border-[var(--orange-hover)]/20
        focus-ring ${className}`}
    >
      <DocumentDownloadIcon size={16} />
      <span className="hidden sm:inline">Resume</span>
    </a>
  );
}

export function TaskbarClock() {
  const [time, setTime] = useState('');
  const mounted = useHasMounted();

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };

    updateTime();
    const interval = window.setInterval(updateTime, 60000);
    return () => window.clearInterval(interval);
  }, [mounted]);

  if (!mounted || !time) {
    return null;
  }

  return (
    <span className="text-xs font-mono text-[var(--text-muted)] tabular-nums pl-2 hidden sm:inline">
      {time}
    </span>
  );
}
