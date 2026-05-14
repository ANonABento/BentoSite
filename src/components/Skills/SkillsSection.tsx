'use client';

import React, { useState, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { staggerFast, scaleIn, buttonTap } from '@/lib/animations';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { analytics } from '@/lib/analytics';
import type { Project } from '@/lib/projects-data';
import {
  categorizeTechnologies,
  type CategorizedKey,
} from '@/lib/skill-categories';

// CPU/chip icon for system info
const SystemIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
);

type SkillCategory = 'hardware' | 'software' | 'tools';

interface SkillsSectionProps {
  onAskAI?: (skill: string) => void;
  isExpanded?: boolean;
  onExpandedChange?: (next: boolean) => void;
  /** When set, the panel re-skins to that project's tech stack */
  selectedProject?: Project | null;
}

const categoryConfig: Record<SkillCategory, { label: string; dotColor: string }> = {
  hardware: {
    label: 'HW_MODULES',
    dotColor: 'bg-[var(--orange)]',
  },
  software: {
    label: 'SW_STACK',
    dotColor: 'bg-[var(--purple)]',
  },
  tools: {
    label: 'DEV_TOOLS',
    dotColor: 'bg-[var(--text-muted)]',
  },
};

// Map the project-mode bucket keys onto the same visual treatment as the
// generic three-category view, so the panel chrome stays identical when it
// re-skins.
const projectCategoryConfig: Record<
  CategorizedKey,
  { dotColor: string; tone: SkillCategory }
> = {
  hardware: { dotColor: 'bg-[var(--orange)]', tone: 'hardware' },
  stack: { dotColor: 'bg-[var(--purple)]', tone: 'software' },
  tooling: { dotColor: 'bg-[var(--text-muted)]', tone: 'tools' },
  misc: { dotColor: 'bg-[var(--text-muted)]', tone: 'tools' },
};

function SkillTag({
  skill,
  category,
  onAskAI
}: {
  skill: string;
  category: SkillCategory;
  onAskAI?: (skill: string) => void;
}) {
  const hoverClasses: Record<SkillCategory, string> = {
    hardware: 'hover:border-[var(--orange)] hover:text-[var(--orange)]',
    software: 'hover:border-[var(--purple)] hover:text-[var(--purple)]',
    tools: 'hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  };

  const handleClick = useCallback(() => {
    analytics.skillClicked(skill);
    onAskAI?.(skill);
  }, [skill, onAskAI]);

  return (
    <m.button
      onClick={handleClick}
      whileTap={buttonTap}
      className={`
        px-2 py-1 text-xs font-mono
        bg-transparent border border-[var(--border)] text-[var(--text-secondary)]
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-[var(--interactive)] focus:ring-opacity-50
        ${hoverClasses[category]}
      `}
      aria-label={`Ask AI about ${skill}`}
    >
      {skill}
    </m.button>
  );
}

function CategorySection({
  label,
  dotColor,
  tone,
  skills,
  onAskAI,
  isExpanded
}: {
  label: string;
  dotColor: string;
  tone: SkillCategory;
  skills: string[];
  onAskAI?: (skill: string) => void;
  isExpanded: boolean;
}) {
  const textColorClass: Record<SkillCategory, string> = {
    hardware: 'text-[var(--orange)]',
    software: 'text-[var(--purple)]',
    tools: 'text-[var(--text-muted)]',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 ${textColorClass[tone]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />
          <span className="text-xs font-semibold font-mono uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">
          {skills.length} loaded
        </span>
      </div>
      <m.div
        className="flex flex-wrap gap-1.5"
        variants={staggerFast}
        initial="hidden"
        animate={isExpanded ? 'visible' : 'hidden'}
      >
        {skills.map((skill) => (
          <m.div key={skill} variants={scaleIn}>
            <SkillTag skill={skill} category={tone} onAskAI={onAskAI} />
          </m.div>
        ))}
      </m.div>
    </div>
  );
}

export function SkillsSection({
  onAskAI,
  isExpanded: isExpandedProp,
  onExpandedChange,
  selectedProject,
}: SkillsSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isControlled = isExpandedProp !== undefined;
  const isExpanded = isControlled ? isExpandedProp : internalExpanded;
  const { skills } = PORTFOLIO_DATA;

  const handleToggle = useCallback(() => {
    const next = !isExpanded;
    if (!isControlled) {
      setInternalExpanded(next);
    }
    onExpandedChange?.(next);
  }, [isControlled, isExpanded, onExpandedChange]);

  const projectGroups = selectedProject
    ? categorizeTechnologies(selectedProject.technologies)
    : null;
  const isProjectMode = projectGroups !== null && projectGroups.length > 0;

  const headerTitle = isProjectMode ? 'project tools' : 'system info';
  const headerSubtitle = isProjectMode
    ? `> ${selectedProject!.id}`
    : '> query system';

  return (
    <div>
      {/* Header */}
      <SectionHeader
        title={headerTitle}
        icon={SystemIcon}
        iconColor="orange"
        subtitle={headerSubtitle}
        mono
        collapsible
        isExpanded={isExpanded}
        onToggle={handleToggle}
      />

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <m.div
            id="skills-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
            role="region"
            aria-label={isProjectMode ? 'Project tech stack' : 'Skills categories'}
          >
            <div className="p-4 space-y-4">
              {isProjectMode ? (
                projectGroups!.map((group) => {
                  const cfg = projectCategoryConfig[group.key];
                  return (
                    <CategorySection
                      key={group.key}
                      label={group.label}
                      dotColor={cfg.dotColor}
                      tone={cfg.tone}
                      skills={group.items}
                      onAskAI={onAskAI}
                      isExpanded={isExpanded}
                    />
                  );
                })
              ) : (
                <>
                  <CategorySection
                    label={categoryConfig.hardware.label}
                    dotColor={categoryConfig.hardware.dotColor}
                    tone="hardware"
                    skills={skills.hardware}
                    onAskAI={onAskAI}
                    isExpanded={isExpanded}
                  />
                  <CategorySection
                    label={categoryConfig.software.label}
                    dotColor={categoryConfig.software.dotColor}
                    tone="software"
                    skills={skills.software}
                    onAskAI={onAskAI}
                    isExpanded={isExpanded}
                  />
                  <CategorySection
                    label={categoryConfig.tools.label}
                    dotColor={categoryConfig.tools.dotColor}
                    tone="tools"
                    skills={skills.tools}
                    onAskAI={onAskAI}
                    isExpanded={isExpanded}
                  />
                </>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SkillsSection;
