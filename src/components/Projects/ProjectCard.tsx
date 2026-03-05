// ProjectCard - Individual project card for the projects modal
'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Project } from '@/lib/projects-data';
import { TechBadge } from './TechBadge';
import { BLUR_PLACEHOLDERS } from '@/lib/image-utils';
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

// Check if project has any viewable media
function hasViewableMedia(project: Project): boolean {
  return !!(
    project.links.modelPath ||
    project.media?.images?.length ||
    project.media?.pdf ||
    project.media?.website ||
    project.media?.video ||
    project.media?.game
  );
}

// Get media type icons for the project
function getMediaIcons(project: Project): { icon: React.ReactNode; label: string }[] {
  const icons: { icon: React.ReactNode; label: string }[] = [];

  if (project.links.modelPath) {
    icons.push({ label: '3D', icon: <Model3DIcon size={12} /> });
  }

  if (project.media?.images?.length) {
    icons.push({ label: 'Images', icon: <ImageIcon size={12} /> });
  }

  if (project.media?.pdf) {
    icons.push({ label: 'PDF', icon: <PDFIcon size={12} /> });
  }

  if (project.media?.website) {
    icons.push({ label: 'Website', icon: <GlobeIcon size={12} /> });
  }

  if (project.media?.game) {
    icons.push({ label: 'Game', icon: <PlayCircleIcon size={12} /> });
  }

  return icons;
}

export function ProjectCard({ project, onSelectProject }: ProjectCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const MAX_VISIBLE_TECHS = 4;
  const visibleTechs = project.technologies.slice(0, MAX_VISIBLE_TECHS);
  const remainingCount = project.technologies.length - MAX_VISIBLE_TECHS;

  const hasExternalLinks = project.links.liveDemo || project.links.github;
  const canView = hasViewableMedia(project);
  const mediaIcons = getMediaIcons(project);

  return (
    <div
      className={`
        backdrop-blur-xl rounded-2xl border border-[var(--border)] bg-[var(--glass-bg)] p-4
        transition-all duration-200 ease-out
        hover:scale-[1.02] hover:border-[var(--interactive)]
        hover:shadow-[0_0_30px_var(--purple-muted)]
        focus:outline-none focus:ring-2 focus:ring-[var(--interactive)] focus:ring-opacity-50
      `}
    >
      {/* Thumbnail - bento compartment (sharp inner corners) */}
      <div className="relative w-full h-36 bg-[var(--glass-bg)] rounded-sm mb-4 flex items-center justify-center border border-[var(--border)] overflow-hidden">
        {project.thumbnail ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 skeleton-shimmer" aria-hidden="true" />
            )}
            <Image
              src={project.thumbnail}
              alt={project.name}
              fill
              className={`object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setImageLoading(false)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDERS['4:3']}
            />
          </>
        ) : (
          <Model3DIcon size={48} className="text-[var(--text-muted)]" aria-hidden="true" />
        )}

        {/* Media type indicators overlay */}
        {mediaIcons.length > 0 && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {mediaIcons.map(({ icon, label }) => (
              <span
                key={label}
                className="p-1.5 rounded bg-[var(--overlay)] text-[var(--text-on-accent)] opacity-80"
                title={label}
              >
                {icon}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Status badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`
            px-2.5 py-1 rounded-sm text-[10px] font-mono font-semibold uppercase tracking-widest
            ${project.status === 'Completed'
              ? 'bg-[var(--status-success-muted)] text-[var(--status-success)] border border-[var(--status-success)] border-opacity-30'
              : project.status === 'In Progress'
                ? 'bg-[var(--status-warning-muted)] text-[var(--status-warning)] border border-[var(--status-warning)] border-opacity-30'
                : 'bg-[var(--glass-bg)] text-[var(--text-muted)] border border-[var(--border)]'
            }
          `}
        >
          {project.status === 'Completed' ? 'READY' : project.status === 'In Progress' ? 'BUILDING' : 'PLANNED'}
        </span>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">{project.category}</span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 line-clamp-1">
        {project.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
        {project.shortDescription}
      </p>

      {/* Tech badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {visibleTechs.map((tech) => (
          <TechBadge key={tech} tech={tech} />
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-[var(--text-muted)] self-center">
            +{remainingCount}
          </span>
        )}
      </div>

      {/* Action buttons */}
      {(hasExternalLinks || canView) && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border)]">
          {/* View in Viewfinder button */}
          {canView && onSelectProject && (
            <button
              type="button"
              onClick={() => onSelectProject(project)}
              aria-label={`View ${project.name} in viewer`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium
                bg-[var(--interactive)] text-[var(--text-on-accent)]
                hover:bg-[var(--interactive-hover)] hover:shadow-[0_0_15px_var(--purple-muted)]
                transition-all duration-200"
            >
              <EyeIcon size={14} />
              View
            </button>
          )}

          {/* Live Demo link */}
          {project.links.liveDemo && (
            <a
              href={project.links.liveDemo}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${project.name} live demo in new window`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium
                bg-[var(--highlight)] text-[var(--text-on-accent)]
                hover:bg-[var(--highlight-hover)] hover:shadow-[0_0_15px_var(--orange-muted)]
                transition-all duration-200"
            >
              <ExternalLinkIcon size={14} />
              Demo
            </a>
          )}

          {/* GitHub link */}
          {project.links.github && (
            <a
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${project.name} on GitHub`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium
                bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-[var(--border)]
                hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]
                transition-all duration-200"
            >
              <GitHubIcon size={14} />
              GitHub
            </a>
          )}
        </div>
      )}
    </div>
  );
}
