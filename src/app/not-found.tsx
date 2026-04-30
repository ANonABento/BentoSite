import Link from 'next/link';
import { ArrowUpRight, Grid2X2, Home, SearchX } from 'lucide-react';
import { BentoIcon } from '@/components/BentoOS/BentoIcon';

const ROUTE_CHECKS = [
  'Checked dashboard routes',
  'Scanned project archive',
  'No matching page found',
];

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] bg-grid px-4 py-10 text-[var(--text-primary)] transition-colors duration-300">
      <div className="absolute inset-0 bg-atmosphere opacity-80" aria-hidden="true" />
      <div
        className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[var(--orange-muted)] to-transparent"
        aria-hidden="true"
      />

      <section className="relative z-10 grid w-full max-w-5xl gap-8 rounded-[var(--radius-bento-outer)] border border-[var(--border)] bg-[var(--glass-bg)] p-5 shadow-glow backdrop-blur-xl md:grid-cols-[0.95fr_1.05fr] md:p-8">
        <div className="flex min-h-[360px] flex-col justify-between rounded-[var(--radius-bento-inner)] border border-[var(--border)] bg-[var(--surface-deep)] p-5">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="interactive-hover focus-ring inline-flex items-center gap-2 rounded-lg px-2 py-1.5 font-mono text-sm text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]"
              aria-label="Go to home page"
            >
              <BentoIcon size={18} />
              <span>
                <span className="text-[var(--orange)]">bent</span>
                <span className="text-[var(--purple)]">OS</span>
              </span>
            </Link>
            <span className="rounded-full border border-[var(--orange)] bg-[var(--orange-muted)] px-3 py-1 font-mono text-xs uppercase tracking-[0.18em] text-[var(--orange)]">
              404
            </span>
          </div>

          <div className="relative mx-auto grid aspect-square w-full max-w-[280px] place-items-center">
            <div className="absolute inset-4 rounded-full border border-[var(--purple-muted)]" />
            <div className="absolute inset-10 rounded-full border border-[var(--orange-muted)] animate-[not-found-orbit_8s_linear_infinite]" />
            <div className="absolute h-3/4 w-px bg-gradient-to-b from-transparent via-[var(--purple)] to-transparent opacity-60 animate-[not-found-sweep_5s_ease-in-out_infinite]" />
            <div className="absolute w-3/4 h-px bg-gradient-to-r from-transparent via-[var(--orange)] to-transparent opacity-60 animate-[not-found-sweep_5s_ease-in-out_infinite]" />
            <div className="glass grid h-28 w-28 place-items-center rounded-[var(--radius-bento-inner)] border-[var(--border)] animate-[not-found-float_6s_ease-in-out_infinite]">
              <SearchX size={44} className="text-[var(--purple)]" aria-hidden="true" />
            </div>
          </div>

          <div className="grid gap-2 font-mono text-xs text-[var(--text-muted)]">
            {ROUTE_CHECKS.map((check, index) => (
              <div key={check} className="flex items-center justify-between gap-3">
                <span>{check}</span>
                <span
                  className={
                    index === ROUTE_CHECKS.length - 1
                      ? 'text-[var(--orange)]'
                      : 'text-[var(--status-success)]'
                  }
                >
                  {index === ROUTE_CHECKS.length - 1 ? 'miss' : 'ok'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center py-2 md:py-8">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.32em] text-[var(--text-muted)]">
            Route not found
          </p>
          <h1 className="mb-5 max-w-xl text-4xl font-bold leading-tight text-[var(--text-primary)] md:text-6xl">
            This page drifted out of the viewport.
          </h1>
          <p className="mb-8 max-w-xl text-base leading-7 text-[var(--text-secondary)] md:text-lg">
            The URL does not map to an active page, but the portfolio is still running.
            Head back to the dashboard or jump straight into the project archive.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="btn-shine interactive-hover focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--interactive)] px-5 py-3 text-sm font-semibold text-[var(--text-on-accent)] shadow-[0_0_20px_var(--purple-muted)] hover:bg-[var(--interactive-hover)]"
            >
              <Home size={18} aria-hidden="true" />
              Go home
            </Link>
            <Link
              href="/projects"
              className="interactive-hover focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--glass-bg)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--orange-muted)] hover:bg-[var(--orange-muted)]"
            >
              <Grid2X2 size={18} aria-hidden="true" />
              View projects
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
