'use client';

import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { useClipboard } from '@/lib/clipboard';
import { analytics } from '@/lib/analytics';
import { BentoIcon } from '@/components/BentoOS/BentoIcon';
import {
  CheckIcon,
  CameraIcon,
  FolderIcon,
  GitHubIcon,
  GridIcon,
  LinkedInIcon,
  MailIcon,
  PlayCircleIcon,
} from '@/components/ui/Icons';
import { RESUME_URL } from '@/lib/constants';
import { HeaderSocialLink, ResumeButton, ThemeToggle } from './Header.parts';

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
            className={`interactive-hover flex items-center gap-2 px-4 py-2.5 rounded-lg transform border focus-ring ${
              copiedEmail
                ? 'bg-[var(--status-success)] text-[var(--text-on-accent)] scale-105 shadow-[0_0_20px_var(--status-success-muted)] border-[var(--status-success)]'
                : 'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive)] hover:scale-105 hover:shadow-[0_0_20px_var(--purple-muted)] hover:border-[var(--purple-muted)] border-[var(--border)]'
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
            className="interactive-hover flex items-center gap-2 px-4 py-2.5 rounded-lg transform border focus-ring glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive)] hover:text-[var(--text-on-accent)] hover:scale-105 hover:shadow-[0_0_20px_var(--purple-muted)] hover:border-[var(--purple-muted)] border-[var(--border)]"
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
  resumeUrl = RESUME_URL,
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
      visibleLabelClassName: 'hidden lg:inline',
      icon: <PlayCircleIcon size={16} />,
    },
    {
      href: '/projects',
      label: 'View Projects',
      text: 'View Projects',
      visibleLabelClassName: 'hidden lg:inline',
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
      visibleLabelClassName: 'hidden xl:inline',
      icon: <CameraIcon size={16} />,
    },
    {
      href: '/scrollable',
      label: 'Read the long-form portfolio',
      text: 'About',
      visibleLabelClassName: 'hidden xl:inline',
      icon: <FolderIcon size={16} />,
    },
  ];

  if (compact) {
    return (
      <header className="dashboard-nav flex flex-wrap items-center gap-x-2 gap-y-1 px-2 py-2 sm:flex-nowrap sm:px-3">
        {/* The wordmark alone never named the person behind the site. The
            dashboard is the landing surface, so the name has to be legible
            here at every width, not only in the chat greeting. */}
        <div className="order-1 flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
          <BentoIcon size={34} />
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-base font-bold font-mono tracking-tight">
              <span className="text-[var(--text-primary)]">bentOS</span>
            </h1>
            <p className="truncate font-mono text-[10px] text-[var(--text-muted)]">
              {name}
              <span className="hidden lg:inline"> / {tagline}</span>
            </p>
          </div>
        </div>

        {/* Below `sm` this wrapper is a full-width second row, so navigation and
            contact links keep their place on a phone instead of being dropped.
            From `sm` it becomes `display: contents` and its two children join
            the header's own flex row directly — same markup, no duplicates. */}
        <div className="order-3 flex w-full items-center gap-1 sm:order-2 sm:contents">
          <nav aria-label="Sections" className="flex items-center gap-1 sm:ml-3 sm:gap-3">
            <div className="hidden sm:block w-px h-5 bg-gradient-to-b from-transparent via-[var(--border)] to-transparent" />
            {compactNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={link.onClick}
                className="interactive-hover flex flex-shrink-0 items-center gap-2 px-1.5 py-1.5 text-sm font-medium font-mono text-[var(--text-secondary)] hover:text-[var(--orange)] hover:bg-[var(--glass-bg)] sm:px-3"
                aria-label={link.label}
              >
                {link.icon}
                <span className={link.visibleLabelClassName}>{link.text}</span>
              </Link>
            ))}
          </nav>

          <nav aria-label="Contact" className="ml-auto flex flex-shrink-0 items-center gap-1">
            {socialLinks.map((link) =>
              link.id === 'email' ? (
                <button
                  key={link.id}
                  onClick={handleEmailClick}
                  className={`interactive-hover p-2 focus-ring ${
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
                  className="interactive-hover p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] focus-ring"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              )
            )}
          </nav>
        </div>

        <div className="order-2 flex flex-shrink-0 items-center gap-1 sm:order-3">
          <ThemeToggle />
          <ResumeButton resumeUrl={resumeUrl} className="ml-1" />
        </div>
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

      <div className="h-px bg-[var(--purple-muted)]" />
    </header>
  );
}
