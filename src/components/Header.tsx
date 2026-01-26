'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/theme-context';

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

// Theme toggle button component
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        // Sun icon for switching to light mode
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon for switching to dark mode
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
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
        bg-gradient-to-r from-indigo-600 to-violet-600 text-white
        hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105
        transition-all duration-300 ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="hidden sm:inline">Resume</span>
    </a>
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
      label: 'Email',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  if (compact) {
    return (
      <header className="flex items-center justify-between px-4 py-3 glass rounded-xl">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gradient">{name}</h1>
          <span className="text-sm text-gray-400 hidden sm:inline">|</span>
          <span className="text-sm text-gray-400 hidden sm:inline">{tagline}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              aria-label={link.label}
            >
              {link.icon}
            </a>
          ))}
          {onProjectsClick && (
            <button
              onClick={onProjectsClick}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                glass text-gray-300 hover:text-white hover:bg-white/10
                transition-all duration-200"
              aria-label="View projects"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="hidden sm:inline">Projects</span>
            </button>
          )}
          <ResumeButton resumeUrl={resumeUrl} className="ml-2" />
        </div>
      </header>
    );
  }

  return (
    <header className="relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5" />

      <div className="relative px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Name with gradient */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-gradient">{name}</span>
          </h1>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-gray-400 mb-8">
            {tagline}
          </p>

          {/* Social links + Resume */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setIsHovered(link.id)}
                onMouseLeave={() => setIsHovered(null)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl
                  transition-all duration-300 transform
                  ${isHovered === link.id
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white scale-105 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                    : 'glass text-gray-300 hover:text-white'
                  }
                `}
                aria-label={link.label}
              >
                {link.icon}
                <span className="text-sm font-medium hidden sm:inline">{link.label}</span>
              </a>
            ))}
            <ResumeButton resumeUrl={resumeUrl} />
          </div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
    </header>
  );
}
