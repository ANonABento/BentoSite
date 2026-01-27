// ProjectCard - Individual project card for the projects modal

import Image from 'next/image';
import type { Project } from '@/lib/projects-data';
import { TechBadge } from './TechBadge';

interface ProjectCardProps {
  project: Project;
  onLoad3DModel?: (modelPath: string) => void;
}

export function ProjectCard({ project, onLoad3DModel }: ProjectCardProps) {
  const MAX_VISIBLE_TECHS = 4;
  const visibleTechs = project.technologies.slice(0, MAX_VISIBLE_TECHS);
  const remainingCount = project.technologies.length - MAX_VISIBLE_TECHS;

  const hasLinks = project.links.liveDemo || project.links.github || project.links.modelPath;

  return (
    <div
      className={`
        backdrop-blur-xl rounded-2xl border border-white/10 bg-white/5 p-4
        transition-all duration-200 ease-out
        hover:scale-[1.02] hover:border-white/20
        hover:shadow-[0_0_30px_rgba(167,139,250,0.2)]
        focus:outline-none focus:ring-2 focus:ring-violet-500/50
      `}
    >
      {/* Thumbnail - bento compartment (sharp inner corners) */}
      <div className="relative w-full h-36 bg-gradient-to-br from-gray-800 to-gray-900 rounded-sm mb-4 flex items-center justify-center border border-white/10 overflow-hidden">
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={project.name}
            fill
            className="object-cover"
          />
        ) : (
          <svg
            className="w-12 h-12 text-gray-600"
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
      </div>

      {/* Status badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`
            px-2.5 py-1 rounded-none text-xs font-medium uppercase tracking-wide
            ${project.status === 'Completed'
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : project.status === 'In Progress'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }
          `}
        >
          {project.status}
        </span>
        <span className="text-xs text-gray-500">{project.category}</span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-white mb-2 leading-tight">{project.name}</h3>

      {/* Description */}
      <p className="text-sm text-gray-400 mb-3 line-clamp-2 leading-relaxed">
        {project.shortDescription}
      </p>

      {/* Tech badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {visibleTechs.map((tech) => (
          <TechBadge key={tech} tech={tech} />
        ))}
        {remainingCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-gray-500">
            +{remainingCount}
          </span>
        )}
      </div>

      {/* Action buttons */}
      {hasLinks && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
          {project.links.liveDemo && (
            <a
              href={project.links.liveDemo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium
                bg-gradient-to-r from-violet-500 to-purple-600 text-white
                hover:shadow-[0_0_15px_rgba(167,139,250,0.4)]
                transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Demo
            </a>
          )}
          {project.links.github && (
            <a
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium
                bg-white/5 text-gray-300 border border-white/10
                hover:bg-white/10 hover:text-white
                transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
          )}
          {project.links.modelPath && onLoad3DModel && (
            <button
              onClick={() => onLoad3DModel(project.links.modelPath!)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium
                bg-gradient-to-r from-orange-500 to-amber-500 text-white
                hover:shadow-[0_0_15px_rgba(251,146,60,0.4)]
                transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              3D Model
            </button>
          )}
        </div>
      )}
    </div>
  );
}
