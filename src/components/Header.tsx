'use client';

import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { useClipboard } from '@/lib/clipboard';
import { analytics } from '@/lib/analytics';
import { BentoIcon } from '@/components/BentoOS/BentoIcon';
import {
  CheckIcon,
  CameraIcon,
  GitHubIcon,
  GridIcon,
  LinkedInIcon,
  MailIcon,
  PlayCircleIcon,
} from '@/components/ui/Icons';
import { HeaderSocialLink, ResumeButton, TaskbarClock, ThemeToggle } from './Header.parts';

type CompactNavLink = {
  href: string;
  label: string;
  text: string;
  visibleLabelClassName: string;
  icon: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
};

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

function SocialActions({
  copiedEmail,
  handleEmailClick,
  socialLinks,
}: {
  copiedEmail: boolean;
  handleEmailClick: (event: React.MouseEvent) => Promise<void>;
  socialLinks: HeaderSocialLink[];
}) {
  return (
    <>
      {socialLinks.map((link) =>
        link.id === 'email' ? (
          <button
            key={link.id}
            onClick={handleEmailClick}
            data-magnetic
            className={`interactive-hover flex items-center gap-2 px-4 py-2.5 rounded-lg transform border focus-ring ${
              copiedEmail
                ? 'bg-[var(--status-success)] text-[var(--text-on-accent)] scale-105 shadow-[0_0_20px_var(--status-success-muted)] border-[var(--status-success)]'
                : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive)] hover:scale-105 hover:shadow-[0_0_20px_var(--primary-muted)] hover:border-[var(--primary-muted)] border-[var(--border)]'
            }`}
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
            data-magnetic
            className="interactive-hover flex items-center gap-2 px-4 py-2.5 rounded-lg transform border focus-ring glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive)] hover:text-[var(--text-on-accent)] hover:scale-105 hover:shadow-[0_0_20px_var(--primary-muted)] hover:border-[var(--primary-muted)] border-[var(--border)]"
            aria-label={link.label}
          >
            {link.icon}
            <span className="text-sm font-medium hidden sm:inline">{link.label}</span>
          </a>
        )
      )}
    </>
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
  const toast = useToast();
  const { copied: copiedEmail, copy: copyEmail } = useClipboard();

  const handleEmailClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    const success = await copyEmail(email);

    if (success) {
      toast.success('Email copied to clipboard!');
      analytics.emailCopied();
      return;
    }

    window.location.href = `mailto:${email}`;
  };

  const socialLinks: HeaderSocialLink[] = [
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
  const compactNavLinks: CompactNavLink[] = [
    {
      href: '/playground',
      label: 'Open playground',
      text: 'Playground',
      visibleLabelClassName: 'hidden sm:inline',
      icon: <PlayCircleIcon size={16} />,
    },
    {
      href: '/projects',
      label: 'View Projects',
      text: 'Projects',
      visibleLabelClassName: 'hidden sm:inline',
      icon: <GridIcon size={16} />,
      onClick: onProjectsClick
        ? (event) => {
            event.preventDefault();
            onProjectsClick();
          }
        : undefined,
    },
    {
      href: '/photography',
      label: 'View Photography',
      text: 'Photography',
      visibleLabelClassName: 'hidden lg:inline',
      icon: <CameraIcon size={16} />,
    },
  ];

  if (compact) {
    return (
      <header className="flex items-center justify-between px-4 py-3 glass rounded-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BentoIcon size={20} />
            <h1 className="text-base font-bold font-mono tracking-tight">
              <span className="text-[var(--orange)]">bent</span>
              <span className="text-[var(--primary)]">OS</span>
            </h1>
          </div>
          <div className="hidden sm:block w-px h-5 bg-gradient-to-b from-transparent via-[var(--border)] to-transparent" />
          {compactNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={link.onClick}
              data-magnetic
              className="interactive-hover flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]"
              aria-label={link.label}
            >
              {link.icon}
              <span className={link.visibleLabelClassName}>{link.text}</span>
            </Link>
          ))}
        </div>

        <nav aria-label="Main navigation" className="flex items-center gap-1">
          {socialLinks.map((link) =>
            link.id === 'email' ? (
              <button
                key={link.id}
                onClick={handleEmailClick}
                data-magnetic
                className={`interactive-hover p-2 rounded-lg focus-ring ${
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
                data-magnetic
                className="interactive-hover p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] rounded-lg focus-ring"
                aria-label={link.label}
              >
                {link.icon}
              </a>
            )
          )}
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-[var(--text-primary)]">
            {name}
          </h1>

          <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-8">{tagline}</p>

          <nav aria-label="Social links" className="flex items-center justify-center gap-4 flex-wrap">
            <SocialActions
              copiedEmail={copiedEmail}
              handleEmailClick={handleEmailClick}
              socialLinks={socialLinks}
            />
            <ResumeButton resumeUrl={resumeUrl} />
          </nav>
        </div>
      </div>

      <div className="h-px bg-[var(--primary-muted)]" />
    </header>
  );
}
