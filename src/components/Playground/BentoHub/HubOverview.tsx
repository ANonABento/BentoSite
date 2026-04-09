'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BENTO_CARDS, getGameCards } from './BentoHub.config';
import type { PlaygroundHubStats } from '../playground-storage';

interface HubOverviewProps {
  stats: PlaygroundHubStats;
}

export function HubOverview({ stats }: HubOverviewProps) {
  const gameCount = getGameCards().length;

  return (
    <section className="mb-10">
      <div className="pg-surface-glass overflow-hidden rounded-[2rem] bg-[rgba(8,10,22,0.72)] shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
          <div>
            <div className="pg-chip mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-[0.24em] text-[var(--pg-text-muted)]">
              <span className="h-2 w-2 rounded-full bg-[var(--pg-accent-gold)]" />
              Playground archive
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--pg-text-primary)] md:text-5xl">
              Small games, timing drills, and UI experiments that feel like a real lab.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--pg-text-secondary)]">
              This area works best when it feels like an instrument panel, not a pile of links.
              Drag the cards around, pick a mode, and keep scores on-device while the hub keeps
              the whole collection legible.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/playground/rhythm" className="pg-button pg-button-primary">
                Start with Rhythm
              </Link>
              <Link href="/playground/reaction" className="pg-button pg-button-secondary">
                Warm up reflexes
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            <StatCard label="Modes" value={`${gameCount}`} detail={`${BENTO_CARDS.length - gameCount} hub card tracks scores`} />
            <StatCard label="Tracked" value={`${stats.trackedModes}`} detail="modes with saved progress" />
            <StatCard label="Best Reaction" value={stats.bestReaction} detail="lowest average click time" />
            <StatCard label="Best Typing" value={stats.bestTyping} detail={`top rhythm: ${stats.topRhythm}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="pg-surface-glass rounded-3xl p-4"
    >
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--pg-text-muted)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[var(--pg-text-primary)]">{value}</div>
      <div className="mt-2 text-sm leading-6 text-[var(--pg-text-secondary)]">{detail}</div>
    </motion.div>
  );
}
