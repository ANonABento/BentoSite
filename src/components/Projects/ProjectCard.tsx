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

  const canView = hasViewableMedia(project);
  const mediaIcons = getMediaIcons(project);

  return (
    <div
      className={`
        backdrop-blur-xl rounded-2xl border border-[var(--border)] bg-[var(--glass-bg)] p-4
        transition-all duration-200 ease-out
        hover:scale-[1.02] hover:border-[var(--interactive)]
        hover:shadow-[0_0_30px_rgba(167,139,250,0.2)]
        focus:outline-none focus:ring-2 focus:ring-violet-500/50
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
                className="p-1.5 rounded bg-black/60 text-white/80"
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
          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
            project.status === 'Completed'
              ? 'bg-emerald-500/20 text-emerald-400'
              : project.status === 'In Progress'
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}
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
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border)]">
        {canView && (
          <button
            onClick={() => onSelectProject?.(project)}
            className="px-3 py-1.5 text-sm font-medium bg-[var(--interactive)] text-white rounded-lg hover:bg-[var(--interactive-hover)] active:bg-[var(--interactive-active)] transition-colors"
          >
            View
          </button>
        )}
        {project.links.github && (
          <a
            href={project.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm font-medium bg-[var(--glass-bg)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--glass-bg-strong)] transition-colors border border-[var(--border)]"
          >
            GitHub
          </a>
        )}
        {project.links.liveDemo && (
          <a
            href={project.links.liveDemo}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm font-medium bg-[var(--glass-bg)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--glass-bg-strong)] transition-colors border border-[var(--border)]"
          >
            Demo
          </a>
        )}
      </div>
    </div>
  );
}
