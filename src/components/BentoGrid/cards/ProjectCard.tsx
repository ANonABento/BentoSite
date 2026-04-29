'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import {
  ExternalLinkIcon,
  GitHubIcon,
  Model3DIcon,
} from '@/components/ui/Icons';
import type { CardPosition, ProjectCardData, ThemeConfig } from '../BentoGrid.types';
import { BaseCard } from './BaseCard';

export interface ProjectCardProps {
  card: ProjectCardData;
  position: CardPosition;
  theme: ThemeConfig;
  onClick?: () => void;
  isFocused?: boolean;
  entranceIndex?: number;
}

const BLUR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

type ProjectStatus = ProjectCardData['status'];

const STATUS_CONFIG: Record<
  NonNullable<ProjectStatus>,
  { label: string; color: string; background: string; border: string }
> = {
  Completed: {
    label: 'READY',
    color: 'var(--status-success)',
    background: 'var(--status-success-muted)',
    border: 'var(--status-success)',
  },
  'In Progress': {
    label: 'WIP',
    color: 'var(--status-warning)',
    background: 'var(--status-warning-muted)',
    border: 'var(--status-warning)',
  },
  Archived: {
    label: 'ARCHIVED',
    color: 'var(--text-muted)',
    background: 'var(--glass-bg)',
    border: 'var(--glass-border)',
  },
};

function StatusBadge({ status }: { status?: ProjectStatus }) {
  if (!status) return null;

  const config = STATUS_CONFIG[status];

  return (
    <span
      className="rounded px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wider"
      style={{
        color: config.color,
        background: config.background,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.label}
    </span>
  );
}

function MediaIndicators({ card }: { card: ProjectCardData }) {
  if (!card.links?.modelPath) return null;

  return (
    <div className="absolute bottom-1.5 right-1.5 flex gap-1">
      <span
        className="rounded p-1 backdrop-blur-sm"
        style={{ background: 'var(--overlay)', color: 'var(--text-on-overlay)' }}
        title="3D"
      >
        <Model3DIcon size={10} />
      </span>
    </div>
  );
}

export function ProjectCard({
  card,
  position,
  theme,
  onClick,
  isFocused = false,
  entranceIndex = 0,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isLargeCard = position.size === '2x2' || position.size === '2x1';

  return (
    <BaseCard
      position={position}
      theme={theme}
      onClick={onClick}
      isFocused={isFocused}
      entranceIndex={entranceIndex}
      onHoverChange={setIsHovered}
      hoverShadow={`${theme.card.hoverShadow}, 0 0 20px ${theme.accent.primary}10`}
    >
      <div className="relative h-1/2 w-full overflow-hidden" style={{ background: 'var(--overlay-weak)' }}>
        {card.thumbnail ? (
          <>
            {!imageLoaded && (
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  background:
                    'linear-gradient(135deg, var(--glass-bg-strong), transparent)',
                }}
              />
            )}
            <Image
              src={card.thumbnail}
              alt={card.title}
              fill
              className={[
                'object-cover transition-all duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0',
                isHovered ? 'scale-105' : 'scale-100',
              ].join(' ')}
              onLoad={() => setImageLoaded(true)}
              sizes={`${position.width}px`}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              draggable={false}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, var(--purple-muted), transparent)',
            }}
          >
            <Model3DIcon size={32} className="opacity-25" />
          </div>
        )}

        <div className="absolute left-2 top-2">
          <StatusBadge status={card.status} />
        </div>

        <MediaIndicators card={card} />

        <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ background: 'linear-gradient(to top, var(--overlay), transparent)' }} />
      </div>

      <div className="flex h-1/2 flex-col p-3">
        <h3
          className={[
            'line-clamp-1 font-semibold',
            isLargeCard ? 'text-base' : 'text-sm',
          ].join(' ')}
          style={{ color: 'var(--text-primary)' }}
        >
          {card.title}
        </h3>

        {isLargeCard && card.description && (
          <p className="mt-1 line-clamp-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {card.description}
          </p>
        )}

        <div className="flex-1" />

        {card.category && (
          <div className="mt-1">
            <span
              className="font-mono text-[9px] uppercase tracking-wider"
              style={{ color: theme.accent.primary }}
            >
              {card.category}
            </span>
          </div>
        )}

        {position.size === '2x2' && card.technologies && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {card.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="rounded px-1.5 py-0.5 font-mono text-[9px]"
                style={{
                  color: 'var(--text-muted)',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                {tech}
              </span>
            ))}
            {card.technologies.length > 4 && (
              <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                +{card.technologies.length - 4}
              </span>
            )}
          </div>
        )}

        {isHovered && isLargeCard && (card.links?.github || card.links?.demo) && (
          <motion.div
            className="mt-2 flex gap-2"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {card.links.github && (
              <a
                href={card.links.github}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                className="flex items-center gap-1 rounded px-2 py-1 text-[9px] font-medium transition-colors hover:bg-[var(--glass-bg-strong)]"
                style={{
                  color: 'var(--text-secondary)',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                }}
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
                onClick={(event) => event.stopPropagation()}
                className="flex items-center gap-1 rounded px-2 py-1 text-[9px] font-medium transition-colors"
                style={{
                  background: theme.accent.primary,
                  color: 'var(--text-on-accent)',
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
