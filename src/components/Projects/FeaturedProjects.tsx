'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { m } from 'framer-motion';
import { sectionItem, staggerContainer, staggerItem } from '@/lib/animations';
import {
  formatProjectDate,
  getFeaturedProjects,
  getProjectExternalLinkCount,
  getProjectMediaTypes,
  getProjectThumbnail,
  getProjectTimelineLabel,
  type Project,
} from '@/lib/projects-data';
import {
  filterProjectsByTechnology,
  getFeaturedTechnologyFilterOptions,
} from './FeaturedProjects.utils';
import { FilterChip, SectionStat } from './FeaturedProjects.parts';
import { PROJECT_CATEGORY_THEMES, PROJECT_STATUS_COPY } from './project-theme';

const FEATURED_PROJECTS = getFeaturedProjects();
const TECHNOLOGY_FILTERS = getFeaturedTechnologyFilterOptions(FEATURED_PROJECTS);

interface FeaturedProjectsProps {
  onViewAll?: () => void;
}

export function FeaturedProjects({ onViewAll }: FeaturedProjectsProps) {
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  const filteredProjects = useMemo(() => {
    return filterProjectsByTechnology(FEATURED_PROJECTS, selectedTech);
  }, [selectedTech]);

  const spotlight = filteredProjects[0];
  const supportingProjects = filteredProjects.slice(1);

  return (
    <section id="projects" className="py-16 md:py-24">
      <m.div
        className="mx-auto max-w-6xl px-4 md:px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        <m.div variants={sectionItem} className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-mono uppercase tracking-[0.32em] text-[var(--text-muted)]">
              Projects
            </p>
            <h2 className="mb-4 text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
              Robotics-first work, with the software and hardware depth to back it up.
            </h2>
            <p className="text-base leading-7 text-[var(--text-secondary)]">
              The strongest work here is hands-on: robot perception pipelines, servo-heavy systems,
              custom boards, and the interfaces needed to make them usable. The featured set below
              is the fastest read on that range.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-left">
            <SectionStat label="Featured" value={`${FEATURED_PROJECTS.length}`} />
            <SectionStat
              label="Disciplines"
              value={`${new Set(FEATURED_PROJECTS.map((project) => project.category)).size}`}
            />
            <SectionStat label="Stacks" value={`${TECHNOLOGY_FILTERS.length}`} />
          </div>
        </m.div>

        <m.div
          variants={sectionItem}
          className="mb-8 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter featured projects by technology"
        >
          <FilterChip
            active={selectedTech === null}
            label="Show all featured projects"
            onClick={() => setSelectedTech(null)}
          >
            All featured
          </FilterChip>
          {TECHNOLOGY_FILTERS.map(({ technology, count }) => (
            <FilterChip
              key={technology}
              active={selectedTech === technology}
              label={`Show featured projects using ${technology}`}
              onClick={() => setSelectedTech(selectedTech === technology ? null : technology)}
            >
              <span>{technology}</span>
              <span className="rounded-full border border-current/20 px-1.5 text-[11px] leading-5 opacity-80">
                {count}
              </span>
            </FilterChip>
          ))}
        </m.div>

        {spotlight ? (
          <m.div variants={staggerItem} className="mb-6">
            <SpotlightProjectCard project={spotlight} onViewAll={onViewAll} />
          </m.div>
        ) : null}

        <m.div className="grid gap-5 md:grid-cols-2" variants={staggerContainer}>
          {supportingProjects.map((project) => (
            <m.article
              key={project.id}
              variants={staggerItem}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="card-hover rounded-3xl border border-[var(--border)] bg-[var(--glass-bg)] p-5"
            >
              <CompactProjectCard project={project} onViewAll={onViewAll} />
            </m.article>
          ))}
        </m.div>

        {selectedTech ? (
          <m.p variants={sectionItem} className="mt-4 text-sm text-[var(--text-muted)]" aria-live="polite">
            Showing {filteredProjects.length} featured project{filteredProjects.length === 1 ? '' : 's'} using {selectedTech}.
          </m.p>
        ) : null}
      </m.div>
    </section>
  );
}

function SpotlightProjectCard({
  project,
  onViewAll,
}: {
  project: Project;
  onViewAll?: () => void;
}) {
  const theme = PROJECT_CATEGORY_THEMES[project.category];
  const status = PROJECT_STATUS_COPY[project.status];
  const thumbnail = getProjectThumbnail(project);
  const completionDate = formatProjectDate(project.dateCompleted);
  const mediaTypes = getProjectMediaTypes(project);
  const externalLinkCount = getProjectExternalLinkCount(project);

  return (
    <m.div
      className="card-hover overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--glass-bg)] shadow-[0_24px_60px_rgba(0,0,0,0.24)]"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="grid lg:grid-cols-[1.25fr_1fr]">
        <div className="relative min-h-[320px] border-b border-[var(--border)] lg:border-b-0 lg:border-r">
          {thumbnail ? (
            <Image src={thumbnail} alt={project.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
          ) : (
            <div className="absolute inset-0" style={{ background: theme.gradient }}>
              <div className="absolute bottom-8 left-8 text-7xl opacity-80">{theme.icon}</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(5,6,18,0.94)] via-[rgba(5,6,18,0.24)] to-transparent" />
          <div className="absolute inset-x-6 bottom-6">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${status.className}`}>
                {status.label}
              </span>
              <span className="project-overlay-chip rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em]">
                {project.category}
              </span>
              {completionDate ? (
                <span className="project-overlay-chip rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em]">
                  {completionDate}
                </span>
              ) : null}
            </div>
            <h3 className="max-w-2xl text-3xl font-semibold text-white">{project.name}</h3>
          </div>
        </div>

        <div className="flex flex-col p-6 md:p-8">
          <p className="mb-5 text-base leading-7 text-[var(--text-secondary)]">
            {project.description || project.shortDescription}
          </p>

          <div className="mb-6 grid grid-cols-3 gap-3">
            <SectionStat label="Tech" value={`${project.technologies.length}`} />
            <SectionStat label="Media" value={`${mediaTypes.length || 0}`} />
            <SectionStat label="Links" value={`${externalLinkCount}`} />
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {project.technologies.slice(0, 6).map((technology) => (
              <span
                key={technology}
                className="rounded-full border border-[var(--border)] bg-[var(--glass-bg)] px-3 py-1 text-sm text-[var(--text-secondary)]"
              >
                {technology}
              </span>
            ))}
          </div>

          <div className="mt-auto flex flex-wrap gap-3">
            {onViewAll ? (
              <button
                type="button"
                onClick={onViewAll}
                className="rounded-full bg-[var(--interactive)] px-5 py-2.5 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--interactive-hover)]"
              >
                Open archive
              </button>
            ) : null}
            {project.links.liveDemo ? (
              <a
                href={project.links.liveDemo}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[var(--highlight)] px-5 py-2.5 text-sm font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--highlight-hover)]"
              >
                Live demo
              </a>
            ) : null}
            {project.links.github ? (
              <a
                href={project.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                Source
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </m.div>
  );
}

function CompactProjectCard({
  project,
  onViewAll,
}: {
  project: Project;
  onViewAll?: () => void;
}) {
  const timelineLabel = getProjectTimelineLabel(project);
  const mediaTypes = getProjectMediaTypes(project);
  const theme = PROJECT_CATEGORY_THEMES[project.category];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="mb-1 text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {project.category}
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">{project.name}</h3>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
          style={{ background: theme.muted }}
        >
          {theme.icon}
        </div>
      </div>

      <p className="mb-4 text-sm leading-6 text-[var(--text-secondary)]">{project.shortDescription}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {project.technologies.slice(0, 4).map((technology) => (
          <span
            key={technology}
            className="rounded-full border border-[var(--border)] bg-[var(--glass-bg)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
          >
            {technology}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
        <div className="text-xs text-[var(--text-muted)]">
          {timelineLabel} · {mediaTypes.length || 0} media surface{mediaTypes.length === 1 ? '' : 's'}
        </div>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-medium text-[var(--interactive)] transition-colors hover:text-[var(--interactive-hover)]"
          >
            Open archive
          </button>
        ) : null}
      </div>
    </div>
  );
}
