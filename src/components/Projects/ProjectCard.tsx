// ProjectCard - Individual project card for the projects modal
'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Project } from '@/lib/projects-data';
import { TechBadge } from './TechBadge';
import { BLUR_PLACEHOLDERS } from '@/lib/image-utils';

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
    icons.push({
      label: '3D',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    });
  }

  if (project.media?.images?.length) {
    icons.push({
      label: 'Images',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    });
  }

  if (project.media?.pdf) {
    icons.push({
      label: 'PDF',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    });
  }

  if (project.media?.website) {
    icons.push({
      label: 'Website',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
    });
  }

  if (project.media?.game) {
    icons.push({
      label: 'Game',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    });
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
          <svg
            className="w-12 h-12 text-[var(--text-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
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
            px-2.5 py-1 rounded-sm text-xs font-medium uppercase tracking-wide
            ${project.status === 'Completed'
              ? 'bg-[var(--status-success-muted)] text-[var(--status-success)] border border-[var(--status-success)] border-opacity-30'
              : project.status === 'In Progress'
                ? 'bg-[var(--status-warning-muted)] text-[var(--status-warning)] border border-[var(--status-warning)] border-opacity-30'
                : 'bg-[var(--glass-bg)] text-[var(--text-muted)] border border-[var(--border)]'
            }
          `}
        >
          {project.status}
        </span>
        <span className="text-xs text-[var(--text-muted)]">{project.category}</span>
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
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
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
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
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
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
          )}
        </div>
      )}
    </div>
  );
}
