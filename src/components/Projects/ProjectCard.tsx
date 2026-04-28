'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import type { Project } from '@/lib/projects-data';
import {
  formatProjectDate,
  getProjectExternalLinkCount,
  getProjectMediaTypes,
  getProjectThumbnail,
  hasProjectViewerMedia,
} from '@/lib/projects-data';
import { BLUR_PLACEHOLDERS } from '@/lib/image-utils';
import { analytics } from '@/lib/analytics';
import { TechBadge } from './TechBadge';
import { PROJECT_CATEGORY_THEMES, PROJECT_STATUS_COPY } from './project-theme';
import {
  Model3DIcon,
  ImageIcon,
  PDFIcon,
  GlobeIcon,
  PlayCircleIcon,
  ExternalLinkIcon,
  GitHubIcon,
  EyeIcon,
} from '@/components/ui/Icons';

interface ProjectCardProps {
  project: Project;
  onSelectProject?: (project: Project) => void;
}

const MEDIA_ICONS = {
  '3D': <Model3DIcon size={12} />,
  Images: <ImageIcon size={12} />,
  PDF: <PDFIcon size={12} />,
  Website: <GlobeIcon size={12} />,
  Video: <PlayCircleIcon size={12} />,
  Game: <PlayCircleIcon size={12} />,
} as const;

export function ProjectCard({ project, onSelectProject }: ProjectCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const thumbnail = getProjectThumbnail(project);
  const theme = PROJECT_CATEGORY_THEMES[project.category];
  const mediaTypes = getProjectMediaTypes(project);
  const status = PROJECT_STATUS_COPY[project.status];
  const completionDate = formatProjectDate(project.dateCompleted);
  const visibleTechs = project.technologies.slice(0, 4);
  const remainingCount = project.technologies.length - visibleTechs.length;
  const canView = hasProjectViewerMedia(project);
  const externalLinkCount = getProjectExternalLinkCount(project);

  const handleViewProject = useCallback(() => {
    analytics.projectViewed(project.id, project.name);
    onSelectProject?.(project);
  }, [onSelectProject, project]);

  const handleExternalLinkClick = useCallback((linkType: 'github' | 'live_demo', url: string) => {
    analytics.externalLinkClicked(linkType, url);
  }, []);

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--glass-bg)] shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--interactive)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.32)]"
    >
      <div className="relative h-48 overflow-hidden border-b border-[var(--border)]">
        {thumbnail ? (
          <>
            {imageLoading && <div className="absolute inset-0 skeleton-shimmer" aria-hidden="true" />}
            <Image
              src={thumbnail}
              alt={project.name}
              fill
              className={`object-cover transition duration-500 ${imageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
              onLoad={() => setImageLoading(false)}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDERS['4:3']}
            />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: theme.gradient }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_42%)]" />
            <div className="absolute bottom-5 left-5 text-5xl opacity-80">{theme.icon}</div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(5,6,18,0.92)] via-[rgba(5,6,18,0.18)] to-transparent" />

        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
          <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${status.className}`}>
            {status.label}
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {mediaTypes.slice(0, 3).map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded-full bg-[rgba(0,0,0,0.55)] px-2 py-1 text-[10px] font-medium text-[var(--text-on-overlay)] backdrop-blur-sm"
                title={type}
              >
                {MEDIA_ICONS[type]}
                <span>{type}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.24em] text-white/70">
              {project.category}
            </p>
            <h3 className="text-xl font-semibold text-white">{project.name}</h3>
          </div>
          {completionDate ? (
            <span className="project-overlay-chip rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em]">
              {completionDate}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="mb-4 text-sm leading-6 text-[var(--text-secondary)]">
          {project.shortDescription}
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {visibleTechs.map((tech) => (
            <TechBadge key={tech} tech={tech} />
          ))}
          {remainingCount > 0 ? (
            <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
              +{remainingCount}
            </span>
          ) : null}
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2 text-left">
          <MetaCell label="Stack" value={`${project.technologies.length}`} />
          <MetaCell label="Media" value={`${mediaTypes.length || 0}`} />
          <MetaCell label="Links" value={`${externalLinkCount}`} />
        </div>

        <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
          {canView && onSelectProject ? (
            <button
              type="button"
              onClick={handleViewProject}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--interactive)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--interactive-hover)]"
            >
              <EyeIcon size={14} />
              <span>Open viewer</span>
            </button>
          ) : null}

          {project.links.liveDemo ? (
            <a
              href={project.links.liveDemo}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleExternalLinkClick('live_demo', project.links.liveDemo!)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--highlight)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--highlight-hover)]"
            >
              <ExternalLinkIcon size={14} />
              <span>Live demo</span>
            </a>
          ) : null}

          {project.links.github ? (
            <a
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleExternalLinkClick('github', project.links.github!)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--glass-bg)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <GitHubIcon size={14} />
              <span>Code</span>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--glass-bg)] px-3 py-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}
