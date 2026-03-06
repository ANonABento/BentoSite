// ProjectCard - Project display card (not draggable)
// Positioned by physics engine, clickable to select

'use client';

import { useState, useEffect, useMemo } from 'react';
import { m } from 'framer-motion';
import Image from 'next/image';
import type { ProjectCardProps } from '../InfiniteGrid.types';
import { Z_INDEX, ANIMATION } from '../InfiniteGrid.constants';
import { BLUR_PLACEHOLDERS } from '@/lib/image-utils';
import {
  Model3DIcon,
  ImageIcon,
  GlobeIcon,
  PlayCircleIcon,
  GitHubIcon,
  ExternalLinkIcon,
} from '@/components/ui/Icons';

export function ProjectCard({
  project,
  layout,
  physicsPosition,
  onClick,
  isEntering = false,
  isExiting = false,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Staggered entrance animation
  useEffect(() => {
    if (isEntering) {
      // New cards wait for fade-in delay
      const timer = setTimeout(() => setIsVisible(true), ANIMATION.fadeInDelay);
      return () => clearTimeout(timer);
    } else {
      // Existing cards show with random stagger
      const delay = Math.random() * 200;
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [isEntering]);

  // Use physics position if available
  const currentX = physicsPosition?.x ?? layout.x;
  const currentY = physicsPosition?.y ?? layout.y;
  const currentAngle = physicsPosition?.angle ?? 0;

  // Media type indicators
  const mediaIndicators = useMemo(() => {
    const indicators: { icon: React.ReactNode; label: string }[] = [];

    if (project.links.modelPath) {
      indicators.push({ icon: <Model3DIcon size={10} />, label: '3D' });
    }
    if (project.media?.images?.length) {
      indicators.push({ icon: <ImageIcon size={10} />, label: 'Images' });
    }
    if (project.media?.website) {
      indicators.push({ icon: <GlobeIcon size={10} />, label: 'Web' });
    }
    if (project.media?.game) {
      indicators.push({ icon: <PlayCircleIcon size={10} />, label: 'Game' });
    }

    return indicators;
  }, [project]);

  const isLargeCard = layout.size === '2x2' || layout.size === '2x1';

  // Position style
  const style = useMemo(() => ({
    position: 'absolute' as const,
    left: currentX - layout.width / 2,
    top: currentY - layout.height / 2,
    width: layout.width,
    height: layout.height,
    zIndex: Z_INDEX.cards,
    transform: currentAngle !== 0 ? `rotate(${currentAngle}rad)` : undefined,
  }), [currentX, currentY, currentAngle, layout]);

  return (
    <m.div
      style={style}
      onClick={() => onClick()}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isExiting ? 0 : isVisible ? 1 : 0,
        scale: isHovered ? ANIMATION.hoverScale : isVisible ? 1 : 0.8,
      }}
      transition={{
        opacity: { duration: isExiting ? ANIMATION.fadeOutDuration / 1000 : ANIMATION.fadeInDuration / 1000 },
        scale: { type: 'spring', stiffness: 300, damping: 25 },
      }}
      className="cursor-pointer select-none"
    >
      <div
        className={`
          h-full w-full
          backdrop-blur-xl rounded-2xl border border-[var(--border)] bg-[var(--glass-bg)] p-3
          transition-all duration-200 ease-out
          ${isHovered ? 'border-[var(--interactive)] shadow-[0_0_30px_var(--purple-muted)]' : ''}
        `}
      >
        {/* Thumbnail */}
        <div className="relative w-full h-1/2 bg-[var(--glass-bg)] rounded-lg mb-2 overflow-hidden border border-[var(--border)]">
          {project.thumbnail ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 skeleton-shimmer" />
              )}
              <Image
                src={project.thumbnail}
                alt={project.name}
                fill
                className={`object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                sizes={`${layout.width}px`}
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDERS['16:9']}
                draggable={false}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Model3DIcon size={32} className="text-[var(--text-muted)]" />
            </div>
          )}

          {/* Media indicators */}
          {mediaIndicators.length > 0 && (
            <div className="absolute bottom-1.5 right-1.5 flex gap-1">
              {mediaIndicators.map(({ icon, label }) => (
                <span
                  key={label}
                  className="p-1 rounded bg-[var(--overlay)] text-[var(--text-on-accent)] opacity-80"
                  title={label}
                >
                  {icon}
                </span>
              ))}
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-1.5 left-1.5">
            <span
              className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold uppercase tracking-wider ${
                project.status === 'Completed'
                  ? 'bg-[var(--status-success-muted)] text-[var(--status-success)] border border-[var(--status-success)] border-opacity-30'
                  : project.status === 'In Progress'
                    ? 'bg-[var(--status-warning-muted)] text-[var(--status-warning)] border border-[var(--status-warning)] border-opacity-30'
                    : 'bg-[var(--glass-bg)] text-[var(--text-muted)] border border-[var(--border)]'
              }`}
            >
              {project.status === 'Completed'
                ? 'READY'
                : project.status === 'In Progress'
                  ? 'WIP'
                  : 'TBD'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(50%-0.5rem)]">
          {/* Title */}
          <h3
            className={`font-semibold text-[var(--text-primary)] line-clamp-1 ${
              isLargeCard ? 'text-base mb-1' : 'text-sm mb-0.5'
            }`}
          >
            {project.name}
          </h3>

          {/* Description - only on larger cards */}
          {isLargeCard && (
            <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mb-auto">
              {project.shortDescription}
            </p>
          )}

          {/* Category */}
          <div className="mt-auto">
            <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              {project.category}
            </span>
          </div>

          {/* Tech badges - only on 2x2 cards */}
          {layout.size === '2x2' && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {project.technologies.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="px-1.5 py-0.5 text-[9px] font-mono bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-[var(--border)] rounded"
                >
                  {tech}
                </span>
              ))}
              {project.technologies.length > 4 && (
                <span className="text-[9px] text-[var(--text-muted)]">
                  +{project.technologies.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Quick links on hover - only on large cards */}
          {isHovered && isLargeCard && (project.links.github || project.links.liveDemo) && (
            <m.div
              className="flex gap-2 mt-1.5"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              {project.links.github && (
                <a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-[var(--border)] rounded hover:text-[var(--text-primary)] transition-colors"
                >
                  <GitHubIcon size={10} />
                  <span>Code</span>
                </a>
              )}
              {project.links.liveDemo && (
                <a
                  href={project.links.liveDemo}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium bg-[var(--highlight)] text-[var(--text-on-accent)] rounded hover:bg-[var(--highlight-hover)] transition-colors"
                >
                  <ExternalLinkIcon size={10} />
                  <span>Demo</span>
                </a>
              )}
            </m.div>
          )}
        </div>
      </div>
    </m.div>
  );
}
