'use client';

/**
 * Project list + ordering.
 *
 * The list IS the ordering model the site uses: drag a project up, save the
 * order, and the top N get the prime grid positions. Everything below the
 * ordered set falls back to newest-first.
 */

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { studioApi, type StudioProject } from './studio-api';
import { buttonClass, primaryButtonClass } from './studio-ui';
import { ProjectForm } from './ProjectForm';

interface ProjectsPanelProps {
  projects: StudioProject[];
  onReload: () => Promise<void>;
  report: (message: string, kind?: 'ok' | 'error' | 'busy', details?: string[]) => void;
}

const EMPTY_PROJECT: StudioProject = {
  id: '',
  name: '',
  shortDescription: '',
  description: '',
  category: '',
  status: 'In Progress',
  technologies: [],
  featured: false,
  dateCompleted: '',
  links: {},
  media: {},
};

export function ProjectsPanel({ projects, onReload, report }: ProjectsPanelProps) {
  const [order, setOrder] = useState<string[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  // The pointer fires `dragover` far faster than React commits, so the handler
  // must not read the list (or the dragged id) from its render closure — doing
  // that reordered against a stale array and the item landed in the wrong slot.
  const dragIdRef = useRef<string | null>(null);

  const ids = order ?? projects.map((project) => project.id);
  const byId = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const orderDirty = order !== null && order.join() !== projects.map((p) => p.id).join();
  const categories = useMemo(
    () => Array.from(new Set(projects.map((project) => project.category))).sort(),
    [projects],
  );

  const selected = creating ? EMPTY_PROJECT : selectedId ? byId.get(selectedId) ?? null : null;

  const moveTo = (targetId: string) => {
    const sourceId = dragIdRef.current;
    if (!sourceId || sourceId === targetId) return;
    setOrder((current) => {
      const list = current ?? projects.map((project) => project.id);
      const from = list.indexOf(sourceId);
      const to = list.indexOf(targetId);
      if (from === -1 || to === -1 || from === to) return current;
      const next = [...list];
      next.splice(from, 1);
      next.splice(to, 0, sourceId);
      return next;
    });
  };

  const saveOrder = async () => {
    report('Saving order…', 'busy');
    try {
      await studioApi.reorderProjects(ids);
      await onReload();
      setOrder(null);
      report('Order saved. Run Sync to publish it.', 'ok');
    } catch (error) {
      report((error as Error).message, 'error');
    }
  };

  const saveProject = async (project: StudioProject) => {
    report('Saving…', 'busy');
    try {
      await studioApi.saveProject(project);
      await onReload();
      setCreating(false);
      setSelectedId(project.id);
      report(`Saved ${project.id}. Run Sync to publish it.`, 'ok');
    } catch (error) {
      const apiError = error as Error & { details?: string[] };
      report(apiError.message, 'error', apiError.details);
    }
  };

  const deleteProject = async (id: string) => {
    report('Deleting…', 'busy');
    try {
      await studioApi.deleteProject(id);
      await onReload();
      setSelectedId(null);
      setOrder(null);
      report(`Deleted ${id}. Its images were left in public/projects/${id}/.`, 'ok');
    } catch (error) {
      report((error as Error).message, 'error');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
      <section className="space-y-2">
        <header className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Projects ({projects.length})
          </h2>
          <span className="flex-1" />
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              setCreating(true);
              setSelectedId(null);
            }}
          >
            New
          </button>
        </header>

        <p className="text-xs text-[var(--text-muted)]">
          Drag to reorder. The top of this list takes the prime grid positions.
        </p>

        <ul className="space-y-1">
          {ids.map((id, index) => {
            const project = byId.get(id);
            if (!project) return null;
            return (
              <li
                key={id}
                draggable
                onDragStart={() => {
                  dragIdRef.current = id;
                  setDragId(id);
                }}
                onDragEnd={() => {
                  dragIdRef.current = null;
                  setDragId(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  moveTo(id);
                }}
                className={`flex cursor-grab items-center gap-2 rounded-md border px-2 py-2 text-sm ${
                  selectedId === id
                    ? 'border-[var(--orange)] bg-[var(--glass-bg)]'
                    : 'border-[var(--border)]'
                } ${dragId === id ? 'opacity-50' : ''}`}
                onClick={() => {
                  setCreating(false);
                  setSelectedId(id);
                }}
              >
                <span className="w-5 text-right font-mono text-xs text-[var(--text-muted)]">
                  {index + 1}
                </span>
                {project.media?.featuredImage ? (
                  <Image
                    src={project.media.featuredImage}
                    alt=""
                    width={40}
                    height={28}
                    className="h-7 w-10 rounded object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="h-7 w-10 rounded border border-dashed border-[var(--border)]" />
                )}
                <span className="min-w-0 flex-1 truncate text-[var(--text-primary)]">
                  {project.name}
                </span>
                {project.featured ? (
                  <span className="rounded bg-[var(--orange-muted)] px-1 text-[10px] uppercase text-[var(--orange)]">
                    feat
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>

        {orderDirty ? (
          <div className="flex gap-2">
            <button type="button" className={primaryButtonClass} onClick={() => void saveOrder()}>
              Save order
            </button>
            <button type="button" className={buttonClass} onClick={() => setOrder(null)}>
              Reset
            </button>
          </div>
        ) : null}
      </section>

      <section>
        {selected ? (
          <ProjectForm
            key={creating ? '__new__' : selected.id}
            project={selected}
            isNew={creating}
            categories={categories}
            onSave={saveProject}
            onDelete={deleteProject}
            onCancel={() => {
              setCreating(false);
              setSelectedId(null);
            }}
          />
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Pick a project to edit, or create a new one.
          </p>
        )}
      </section>
    </div>
  );
}
