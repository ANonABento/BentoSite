'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { useToast } from '@/components/ui/Toast';
import { useClipboard } from '@/lib/clipboard';
import { analytics } from '@/lib/analytics';
import { BentoIcon } from '@/components/BentoOS/BentoIcon';

interface HeaderProps {
  name?: string;
  tagline?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  email?: string;
  resumeUrl?: string;
  compact?: boolean;
  onProjectsClick?: () => void;
}

// SSR-safe mounted check using useSyncExternalStore
const emptySubscribe = () => () => {};
function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

// Theme toggle button component
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const mounted = useHasMounted();

  // Render a placeholder with consistent dimensions during SSR
  if (!mounted) {
    return (
      <button
        className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg transition-all duration-200 focus-ring"
        aria-label="Toggle theme"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg transition-all duration-200 focus-ring"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}

// Resume download button component
function ResumeButton({ resumeUrl, className = '' }: { resumeUrl: string; className?: string }) {
  return (
    <a
      href={resumeUrl}
      download
      onClick={() => analytics.resumeDownloaded()}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
        bg-[var(--orange)] hover:bg-[var(--orange-hover)] active:bg-[var(--orange-active)] text-[var(--text-on-accent)]
        hover:shadow-[0_0_20px_var(--orange-muted)] hover:scale-105
        border border-[var(--orange-hover)]/20
        transition-all duration-300 focus-ring ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="hidden sm:inline">Resume</span>
    </a>
  );
}

// Clock component for taskbar
function TaskbarClock() {
  const [time, setTime] = useState('');
  const mounted = useHasMounted();

  useEffect(() => {
    if (!mounted) return;
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted || !time) return null;

  return (
    <span className="text-xs font-mono text-[var(--text-muted)] tabular-nums pl-2 hidden sm:inline">
      {time}
    </span>
  );
}

export default function Header({
  name = 'Your Name',
  tagline = 'Hardware & Software Engineer',
  githubUrl = 'https://github.com',
  linkedinUrl = 'https://linkedin.com',
  email = 'hello@example.com',
  resumeUrl = '/resume.pdf',
  compact = false,
  onProjectsClick,
}: HeaderProps) {
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const toast = useToast();
  const { copied: copiedEmail, copy: copyEmail } = useClipboard();

  const handleEmailClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const success = await copyEmail(email);
    if (success) {
      toast.success('Email copied to clipboard!');
      analytics.emailCopied();
    } else {
      // Fallback to mailto if clipboard fails
      window.location.href = `mailto:${email}`;
    }
  };

  const socialLinks = [
    {
      id: 'github',
      href: githubUrl,
      label: 'GitHub',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
    },
    {
      id: 'linkedin',
      href: linkedinUrl,
      label: 'LinkedIn',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      id: 'email',
      href: `mailto:${email}`,
      label: copiedEmail ? 'Copied!' : 'Email',
      icon: copiedEmail ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  if (compact) {
    return (
      <header className="flex items-center justify-between px-4 py-3 glass rounded-xl">
        {/* Left: bentOS branding + nav */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BentoIcon size={20} />
            <h1 className="text-base font-bold font-mono tracking-tight">
              <span className="text-[var(--orange)]">bent</span>
              <span className="text-[var(--purple)]">OS</span>
            </h1>
          </div>
          <div className="hidden sm:block w-px h-5 bg-gradient-to-b from-transparent via-[var(--border)] to-transparent" />
          <Link
            href="/playground"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium font-mono
              text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]
              transition-all duration-200"
            aria-label="Fidget games"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">Fidget</span>
          </Link>
          {onProjectsClick && (
            <button
              onClick={onProjectsClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium font-mono
                text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]
                transition-all duration-200 focus-ring"
              aria-label="View projects"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">Projects</span>
            </button>
          )}
        </div>

        {/* Right: socials + theme + resume + clock */}
        <nav aria-label="Main navigation" className="flex items-center gap-1">
          {socialLinks.map((link) => (
            link.id === 'email' ? (
              <button
                key={link.id}
                onClick={handleEmailClick}
                className={`p-2 rounded-lg transition-all duration-200 focus-ring ${
                  copiedEmail
                    ? 'text-[var(--status-success)] bg-[var(--status-success-muted)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
                }`}
                aria-label={copiedEmail ? 'Email copied!' : 'Copy email'}
              >
                {link.icon}
              </button>
            ) : (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg transition-all duration-200 focus-ring"
                aria-label={link.label}
              >
                {link.icon}
              </a>
            )
          ))}
          <ThemeToggle />
          <ResumeButton resumeUrl={resumeUrl} className="ml-1" />
          <TaskbarClock />
        </nav>
      </header>
    );
  }

  return (
    <header className="relative overflow-hidden">
      <div className="relative px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Name */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-[var(--text-primary)]">
            {name}
          </h1>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-8">
            {tagline}
          </p>

          {/* Social links + Resume */}
          <nav aria-label="Social links" className="flex items-center justify-center gap-4 flex-wrap">
            {socialLinks.map((link) => (
              link.id === 'email' ? (
                <button
                  key={link.id}
                  onClick={handleEmailClick}
                  onMouseEnter={() => setIsHovered(link.id)}
                  onMouseLeave={() => setIsHovered(null)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg
                    transition-all duration-200 transform border focus-ring
                    ${copiedEmail
                      ? 'bg-[var(--status-success)] text-[var(--text-on-accent)] scale-105 shadow-[0_0_20px_var(--status-success-muted)] border-[var(--status-success)]'
                      : isHovered === link.id
                        ? 'bg-[var(--interactive)] text-[var(--text-on-accent)] scale-105 shadow-[0_0_20px_var(--purple-muted)] border-[var(--purple-muted)]'
                        : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)]'
                    }
                  `}
                  aria-label={copiedEmail ? 'Email copied!' : 'Copy email'}
                >
                  {link.icon}
                  <span className="text-sm font-medium hidden sm:inline">{link.label}</span>
                </button>
              ) : (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setIsHovered(link.id)}
                  onMouseLeave={() => setIsHovered(null)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg
                    transition-all duration-200 transform border focus-ring
                    ${isHovered === link.id
                      ? 'bg-[var(--interactive)] text-[var(--text-on-accent)] scale-105 shadow-[0_0_20px_var(--purple-muted)] border-[var(--purple-muted)]'
                      : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)]'
                    }
                  `}
                  aria-label={link.label}
                >
                  {link.icon}
                  <span className="text-sm font-medium hidden sm:inline">{link.label}</span>
                </a>
              )
            ))}
            <ResumeButton resumeUrl={resumeUrl} />
          </nav>
        </div>
      </div>

      {/* Bottom line */}
      <div className="h-px bg-[var(--purple-muted)]" />
    </header>
  );
}
