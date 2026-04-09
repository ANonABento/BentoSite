'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { useToast } from '@/components/ui/Toast';
import { useClipboard } from '@/lib/clipboard';
import { analytics } from '@/lib/analytics';
import { BentoIcon } from '@/components/BentoOS/BentoIcon';
import {
  SunIcon,
  MoonIcon,
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
  CheckIcon,
  DocumentDownloadIcon,
  PlayCircleIcon,
  GridIcon,
} from '@/components/ui/Icons';

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
        <SunIcon size={20} />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg transition-all duration-200 focus-ring"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
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
      <DocumentDownloadIcon size={16} />
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
      icon: <GitHubIcon size={20} />,
    },
    {
      id: 'linkedin',
      href: linkedinUrl,
      label: 'LinkedIn',
      icon: <LinkedInIcon size={20} />,
    },
    {
      id: 'email',
      href: `mailto:${email}`,
      label: copiedEmail ? 'Copied!' : 'Email',
      icon: copiedEmail ? <CheckIcon size={20} /> : <MailIcon size={20} />,
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
            <PlayCircleIcon size={16} />
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
              <GridIcon size={16} />
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
