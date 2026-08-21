'use client';

/**
 * Studio shell — tabs, data loading, and the publish controls.
 *
 * Saving writes the source JSON. Publishing is a separate, explicit step:
 * Sync regenerates the bundles and runs the validators, then Commit stages
 * only content paths and (optionally) pushes, which is what triggers a deploy.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  studioApi,
  type StudioPhoto,
  type StudioPortfolio,
  type StudioProject,
  type StudioTalkingPoint,
} from './studio-api';
import { StatusBanner, buttonClass, inputClass, primaryButtonClass } from './studio-ui';
import { ProjectsPanel } from './ProjectsPanel';
import { PhotosPanel } from './PhotosPanel';
import { TalkingPointsPanel } from './TalkingPointsPanel';
import { BioPanel } from './BioPanel';

type Tab = 'projects' | 'photos' | 'talking-points' | 'bio';
type Status = { kind: 'idle' | 'busy' | 'ok' | 'error'; message: string; details?: string[] };

const TABS: { id: Tab; label: string }[] = [
  { id: 'projects', label: 'Projects' },
  { id: 'photos', label: 'Photos' },
  { id: 'talking-points', label: 'Talking points' },
  { id: 'bio', label: 'Bio' },
];

const PREVIEW_LINKS = [
  { href: '/?view=dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projects' },
  { href: '/photography', label: 'Photography' },
  { href: '/scrollable', label: 'Scrollable' },
];

export function StudioApp() {
  const [tab, setTab] = useState<Tab>('projects');
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [photos, setPhotos] = useState<StudioPhoto[]>([]);
  const [points, setPoints] = useState<StudioTalkingPoint[]>([]);
  const [portfolio, setPortfolio] = useState<StudioPortfolio | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [syncOutput, setSyncOutput] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState('');
  const [push, setPush] = useState(false);

  const report = useCallback(
    (message: string, kind: Status['kind'] = 'ok', details?: string[]) =>
      setStatus({ kind, message, details }),
    [],
  );

  const fetchAll = useCallback(async () => {
    const [projectsResult, photosResult, pointsResult, portfolioResult] = await Promise.all([
      studioApi.listProjects(),
      studioApi.listPhotos(),
      studioApi.listTalkingPoints(),
      studioApi.readPortfolio(),
    ]);
    return {
      projects: projectsResult.projects,
      photos: photosResult.photos,
      points: pointsResult.points,
      portfolio: portfolioResult.portfolio,
    };
  }, []);

  const apply = useCallback((data: Awaited<ReturnType<typeof fetchAll>>) => {
    setProjects(data.projects);
    setPhotos(data.photos);
    setPoints(data.points);
    setPortfolio(data.portfolio);
  }, []);

  const reload = useCallback(async () => {
    apply(await fetchAll());
  }, [apply, fetchAll]);

  useEffect(() => {
    let cancelled = false;
    fetchAll()
      .then((data) => {
        if (!cancelled) apply(data);
      })
      .catch((error: Error) => {
        if (!cancelled) report(error.message, 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [apply, fetchAll, report]);

  const sync = async () => {
    report('Running npm run sync…', 'busy');
    setSyncOutput('');
    try {
      const result = await studioApi.sync();
      setSyncOutput(result.output);
      report(
        result.ok ? 'Sync passed — content is regenerated and validated.' : 'Sync failed.',
        result.ok ? 'ok' : 'error',
      );
      await reload();
    } catch (error) {
      report((error as Error).message, 'error');
    }
  };

  const commit = async () => {
    report(push ? 'Committing and pushing…' : 'Committing…', 'busy');
    setSyncOutput('');
    try {
      const result = await studioApi.git(commitMessage, push);
      setSyncOutput(result.output);
      report(result.ok ? 'Done.' : 'Git command failed.', result.ok ? 'ok' : 'error');
      if (result.ok) setCommitMessage('');
    } catch (error) {
      report((error as Error).message, 'error');
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-[1400px] space-y-5 p-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-mono text-lg font-bold text-[var(--text-primary)]">bentOS studio</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Local content editor. Never served in production.
          </p>
          <span className="flex-1" />
          {PREVIEW_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--text-secondary)] underline underline-offset-2 hover:text-[var(--orange)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <nav className="flex flex-wrap gap-2">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                tab === entry.id
                  ? 'bg-[var(--orange)] text-[var(--text-on-accent)]'
                  : 'border border-[var(--border)] text-[var(--text-secondary)]'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </nav>
      </header>

      <StatusBanner status={status} />

      <section className="rounded-md border border-[var(--border)] p-6">
        {tab === 'projects' ? (
          <ProjectsPanel projects={projects} onReload={reload} report={report} />
        ) : null}
        {tab === 'photos' ? (
          <PhotosPanel photos={photos} onReload={reload} report={report} />
        ) : null}
        {tab === 'talking-points' ? (
          <TalkingPointsPanel points={points} onReload={reload} report={report} />
        ) : null}
        {tab === 'bio' ? (
          <BioPanel portfolio={portfolio} onReload={reload} report={report} />
        ) : null}
      </section>

      <section className="space-y-3 rounded-md border border-[var(--border)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Publish</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={buttonClass} onClick={() => void sync()}>
            1. Sync &amp; validate
          </button>
          <input
            className={`${inputClass} max-w-md flex-1`}
            placeholder="Commit message (e.g. Add Tokyo photos)"
            value={commitMessage}
            onChange={(event) => setCommitMessage(event.target.value)}
          />
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <input type="checkbox" checked={push} onChange={(event) => setPush(event.target.checked)} />
            push (deploys)
          </label>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!commitMessage.trim()}
            onClick={() => void commit()}
          >
            2. Commit
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Commit stages only <code>src/content</code>, <code>public/photos</code>, and{' '}
          <code>public/projects</code> — nothing else in your working tree.
        </p>
        {syncOutput ? (
          <pre className="max-h-64 overflow-auto rounded bg-[var(--glass-bg)] p-3 text-xs text-[var(--text-secondary)]">
            {syncOutput}
          </pre>
        ) : null}
      </section>
    </main>
  );
}
