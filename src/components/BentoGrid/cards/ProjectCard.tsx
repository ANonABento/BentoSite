'use client';

/**
 * ProjectCard — media-first card for projects.
 *
 * Thumbnail (or fallback icon) fills the card. Status badge and media
 * indicators (3D etc.) sit in the corners. The title stays readable at rest
 * (`titleAtRest`) so the grid is scannable without hovering; description,
 * category, and a truncated row of tech badges expand on hover/focus. Card
 * click navigates — github/demo links live on the project detail surface,
 * not the card.
 */

import { useState } from 'react';
import Image from 'next/image';
import type { ProjectCardData, CardPosition, ThemeConfig } from '../BentoGrid.types';
import { Model3DIcon } from '@/components/ui/Icons';
import { MediaCard } from './MediaCard';

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
      className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold uppercase tracking-wider backdrop-blur-sm ${config.bg} ${config.text} border ${config.border}`}
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

  if (indicators.length === 0) return null;

  return (
    <div className="flex gap-1">
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
  );
}

// =============================================================================
// TECH BADGES
// =============================================================================

const MAX_TECH_BADGES = 3;

function TechBadges({ technologies }: { technologies?: string[] }) {
  if (!technologies?.length) return null;
  const visible = technologies.slice(0, MAX_TECH_BADGES);
  const overflow = technologies.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((tech) => (
        <span
          key={tech}
          className="px-1.5 py-0.5 text-[9px] font-mono bg-white/10 text-white/80 border border-white/15 rounded"
        >
          {tech}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-[9px] font-mono text-white/60 self-center">+{overflow}</span>
      )}
    </div>
  );
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
  const [imageLoaded, setImageLoaded] = useState(false);

  const meta = (
    <>
      <div className="flex items-center gap-2">
        <StatusBadge status={card.status} />
        {card.category && (
          <span
            className="text-[9px] font-mono uppercase tracking-wider"
            style={{ color: theme.accent.primary }}
          >
            {card.category}
          </span>
        )}
      </div>
      {card.description && (
        <p className="line-clamp-2 text-xs text-white/75">{card.description}</p>
      )}
      <TechBadges technologies={card.technologies} />
    </>
  );

  return (
    <MediaCard
      id={card.id}
      position={position}
      theme={theme}
      isFocused={isFocused}
      entranceIndex={entranceIndex}
      onClick={onClick}
      href={href}
      ariaLabel={`Open ${card.title}`}
      title={card.title}
      metaLines={meta}
      titleAtRest
      topRight={<MediaIndicators card={card} />}
    >
      {card.thumbnail ? (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse" />
          )}
          <Image
            src={card.thumbnail}
            alt={card.title}
            fill
            className={`object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } group-hover:scale-105`}
            onLoad={() => setImageLoaded(true)}
            sizes={`${position.width}px`}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            draggable={false}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--primary-muted)] to-transparent">
          <Model3DIcon size={48} className="text-[var(--text-muted)] opacity-40" />
        </div>
      )}
    </MediaCard>
  );
}
