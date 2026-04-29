'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ExternalLinkIcon, GitHubIcon, Model3DIcon } from '@/components/ui/Icons';
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

function StatusBadge({ status }: { status?: ProjectCardData['status'] }) {
  if (!status) return null;

  const label = status === 'In Progress' ? 'WIP' : status === 'Completed' ? 'READY' : 'ARCHIVED';

  return (
    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold uppercase bg-[var(--glass-bg-strong)] text-[var(--foreground)] border border-[var(--glass-border)]">
      {label}
    </span>
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
      id={card.id}
      position={position}
      theme={theme}
      isFocused={isFocused || isHovered}
      entranceIndex={entranceIndex}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="group h-full w-full">
        <div className="relative w-full h-1/2 bg-[var(--surface-deep)] overflow-hidden">
          {card.thumbnail ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-[var(--glass-bg)] animate-pulse" />
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
            <div className="absolute inset-0 flex items-center justify-center bg-purple-muted">
              <Model3DIcon size={32} className="text-[var(--muted-foreground)]" />
            </div>
          )}

          <div className="absolute top-2 left-2">
            <StatusBadge status={card.status} />
          </div>

          {card.links?.modelPath && (
            <span className="absolute bottom-1.5 right-1.5 p-1 rounded bg-[var(--overlay-strong)] text-[var(--foreground)] backdrop-blur-sm">
              <Model3DIcon size={10} />
            </span>
          )}

          <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--overlay-strong),transparent)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="p-3 flex flex-col h-1/2 min-h-0">
          <h3
            className={[
              'font-semibold text-[var(--foreground)] line-clamp-1',
              isLargeCard ? 'text-base' : 'text-sm',
            ].join(' ')}
          >
            {card.title}
          </h3>

          {isLargeCard && card.description && (
            <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-2 mt-1">
              {card.description}
            </p>
          )}

          <div className="flex-1" />

          {card.category && (
            <span
              className="text-[9px] font-mono uppercase tracking-wider"
              style={{ color: theme.accent.primary }}
            >
              {card.category}
            </span>
          )}

          {position.size === '2x2' && card.technologies && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {card.technologies.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="px-1.5 py-0.5 text-[9px] font-mono bg-[var(--glass-bg)] text-[var(--muted-foreground)] border border-[var(--glass-border)] rounded"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

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
                  onClick={(event) => event.stopPropagation()}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium bg-[var(--glass-bg)] text-[var(--muted-foreground)] border border-[var(--glass-border)] rounded hover:text-[var(--foreground)] transition-colors"
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
                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-medium rounded transition-colors text-[var(--foreground)]"
                  style={{ background: theme.accent.primary }}
                >
                  <ExternalLinkIcon size={10} />
                  <span>Demo</span>
                </a>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </BaseCard>
  );
}
