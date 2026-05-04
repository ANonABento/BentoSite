'use client';

/**
 * ProjectCard - Premium themed card for projects
 *
 * Features:
 * - Clean, professional design
 * - Sharp corners, subtle shadows
 * - Thumbnail with status badge
 * - Tech badges and links
 * - Subtle primary accent on hover
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { ProjectCardData, CardPosition, ThemeConfig } from '../BentoGrid.types';
import {
  Model3DIcon,
  GitHubIcon,
  ExternalLinkIcon,
} from '@/components/ui/Icons';
import { BaseCard } from './BaseCard';

// =============================================================================
// PROPS
// =============================================================================

export interface ProjectCardProps {
  card: ProjectCardData;
  position: CardPosition;
  theme: ThemeConfig;
  onClick?: () => void;
  href?: string;
  /** Whether the card has keyboard focus */
  isFocused?: boolean;
  /** Visible-order index used for entrance staggering */
  entranceIndex?: number;
}

// =============================================================================
// PLACEHOLDER
// =============================================================================

const BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// =============================================================================
// STATUS BADGE
// =============================================================================

type ProjectStatus = ProjectCardData['status'];

function StatusBadge({ status }: { status?: ProjectStatus }) {
  if (!status) return null;

  const statusConfig: Record<NonNullable<ProjectStatus>, {
    label: string;
    bg: string;
    text: string;
    border: string;
  }> = {
    Completed: {
      label: 'READY',
      bg: 'bg-[var(--success-muted)]',
      text: 'text-[var(--success)]',
      border: 'border-[var(--success)]/30',
    },
    'In Progress': {
      label: 'WIP',
      bg: 'bg-[var(--primary-muted)]',
      text: 'text-[var(--primary)]',
      border: 'border-[var(--primary)]/30',
    },
    Archived: {
      label: 'ARCHIVED',
      bg: 'bg-gray-500/10',
      text: 'text-gray-400',
      border: 'border-gray-500/30',
    },
  };
  const config = statusConfig[status];

  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold uppercase tracking-wider ${config.bg} ${config.text} border ${config.border}`}
    >
      {config.label}
    </span>
  );
}

// =============================================================================
// MEDIA INDICATORS
// =============================================================================

function MediaIndicators({ card }: { card: ProjectCardData }) {
  const indicators: { icon: React.ReactNode; label: string }[] = [];

  if (card.links?.modelPath) {
    indicators.push({ icon: <Model3DIcon size={10} />, label: '3D' });
  }

  // Only show first 3 indicators max
  return indicators.length > 0 ? (
    <div className="absolute bottom-1.5 right-1.5 flex gap-1">
      {indicators.slice(0, 3).map(({ icon, label }) => (
        <span
          key={label}
          className="p-1 rounded bg-black/60 text-white/90 backdrop-blur-sm"
          title={label}
        >
          {icon}
        </span>
      ))}
    </div>
  ) : null;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ProjectCard({
  card,
  position,
  theme,
  onClick,
  href,
  isFocused = false,
  entranceIndex = 0,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isHighlighted = isHovered || isFocused;

  const isLargeCard = position.size === '2x2' || position.size === '2x1';

  return (
    <BaseCard
      id={card.id}
      position={position}
      theme={theme}
      isFocused={isFocused}
      entranceIndex={entranceIndex}
      onClick={onClick}
      href={href}
      magnetic
      ariaLabel={`Open ${card.title}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      shellClassName="group"
      shellStyle={{
        border: isHighlighted
          ? `1px solid ${theme.accent.primary}40`
          : theme.card.border,
        boxShadow: isFocused
          ? `0 0 0 3px ${theme.accent.primary}, ${theme.card.hoverShadow}`
          : isHovered
            ? `${theme.card.hoverShadow}, 0 0 20px ${theme.accent.primary}10`
            : theme.card.shadow,
      }}
    >
      {/* Thumbnail */}
      <div className="relative w-full h-1/2 bg-black/20 overflow-hidden">
          {card.thumbnail ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse" />
              )}
              <Image
                src={card.thumbnail}
                alt={card.title}
                fill
                className={`object-cover transition-all duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                } ${isHovered ? 'scale-105' : 'scale-100'}`}
                onLoad={() => setImageLoaded(true)}
                sizes={`${position.width}px`}
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                draggable={false}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--primary-muted)] to-transparent">
              <Model3DIcon size={32} className="text-[var(--text-muted)] opacity-50" />
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <StatusBadge status={card.status} />
          </div>

          {/* Media indicators */}
          <MediaIndicators card={card} />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col h-[calc(50%-0px)]">
          {/* Title */}
          <h3
            className={`font-semibold text-[var(--text-primary)] line-clamp-1 ${
              isLargeCard ? 'text-base' : 'text-sm'
            }`}
          >
            {card.title}
          </h3>

          {/* Description - only on larger cards */}
          {isLargeCard && card.description && (
            <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-1">
              {card.description}
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Category */}
          <div className="mt-1">
            <span
              className="text-[9px] font-mono uppercase tracking-wider"
              style={{ color: theme.accent.primary }}
            >
              {card.category}
            </span>
          </div>

          {/* Tech badges - only on 2x2 cards */}
          {position.size === '2x2' && card.technologies && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {card.technologies.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="px-1.5 py-0.5 text-[9px] font-mono bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-[var(--border)] rounded"
                >
                  {tech}
                </span>
              ))}
              {card.technologies.length > 4 && (
                <span className="text-[9px] text-[var(--text-muted)]">
                  +{card.technologies.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Quick links on hover - only on large cards */}
          {isHovered && isLargeCard && (card.links?.github || card.links?.demo) && (
            <motion.div
              className="flex gap-2 mt-2"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              {card.links.github && (
                <a
                  href={card.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium bg-[var(--glass-bg)] text-[var(--text-secondary)] border border-[var(--border)] rounded hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-strong)] transition-colors"
                >
                  <GitHubIcon size={10} />
                  <span>Code</span>
                </a>
              )}
              {card.links.demo && (
                <a
                  href={card.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium rounded transition-colors text-[var(--text-on-accent)]"
                  style={{
                    background: theme.accent.primary,
                  }}
                >
                  <ExternalLinkIcon size={10} />
                  <span>Demo</span>
                </a>
              )}
            </motion.div>
          )}
      </div>
    </BaseCard>
  );
}
