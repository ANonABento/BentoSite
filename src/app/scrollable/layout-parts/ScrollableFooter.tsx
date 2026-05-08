'use client';

import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { getPortfolioSyncMeta } from '@/lib/projects-data';

const portfolioSyncMeta = getPortfolioSyncMeta();

interface ScrollableFooterProps {
  onScrollToSection: (id: string) => void;
}

function formatSyncDate(value?: string): string {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function ScrollableFooter({ onScrollToSection }: ScrollableFooterProps) {
  return (
    <footer className="py-16 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {PORTFOLIO_DATA.personal.name}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {PORTFOLIO_DATA.personal.title} at {PORTFOLIO_DATA.personal.university}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Quick Links
            </h4>
            <div className="flex flex-col gap-2">
              <button onClick={() => onScrollToSection('about')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--interactive)] transition-colors text-left">About</button>
              <button onClick={() => onScrollToSection('projects')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--interactive)] transition-colors text-left">Projects</button>
              <button onClick={() => onScrollToSection('experience')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--interactive)] transition-colors text-left">Experience</button>
              <button onClick={() => onScrollToSection('skills')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--interactive)] transition-colors text-left">Skills</button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Connect
            </h4>
            <div className="flex gap-4">
              <a href={PORTFOLIO_DATA.personal.github} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
              </a>
              <a href={PORTFOLIO_DATA.personal.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
              <a href={`mailto:${PORTFOLIO_DATA.personal.email}`} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label="Email">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--border)] flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} {PORTFOLIO_DATA.personal.name}. Built with Next.js & Three.js
          </p>
          <div
            className={`text-xs px-3 py-2 rounded-full inline-flex items-center border ${
              portfolioSyncMeta?.stale
                ? 'border-amber-400/60 bg-amber-400/10 text-amber-200'
                : 'border-[var(--border)] bg-[var(--glass-bg)] text-[var(--text-muted)]'
            }`}
          >
            {portfolioSyncMeta?.stale ? 'stale sync' : 'synced'}: {formatSyncDate(portfolioSyncMeta?.lastSyncedAt)}
            {portfolioSyncMeta?.staleReason ? ` · ${portfolioSyncMeta.staleReason}` : ''}
          </div>
        </div>
      </div>
    </footer>
  );
}
