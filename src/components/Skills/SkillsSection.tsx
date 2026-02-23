'use client';

import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { staggerFast, scaleIn, buttonTap } from '@/lib/animations';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BentoIcon } from '@/components/BentoOS/BentoIcon';

type SkillCategory = 'hardware' | 'software' | 'tools';

interface SkillsSectionProps {
  onAskAI?: (skill: string) => void;
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

  return (
    <m.button
      onClick={() => onAskAI?.(skill)}
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
  category,
  skills,
  onAskAI,
  isExpanded
}: {
  category: SkillCategory;
  skills: string[];
  onAskAI?: (skill: string) => void;
  isExpanded: boolean;
}) {
  const config = categoryConfig[category];
  const textColorClass: Record<SkillCategory, string> = {
    hardware: 'text-[var(--orange)]',
    software: 'text-[var(--purple)]',
    tools: 'text-[var(--text-muted)]',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 ${textColorClass[category]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse`} />
          <span className="text-xs font-semibold font-mono uppercase tracking-wider">{config.label}</span>
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
            <SkillTag skill={skill} category={category} onAskAI={onAskAI} />
          </m.div>
        ))}
      </m.div>
    </div>
  );
}

export function SkillsSection({ onAskAI }: SkillsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { skills } = PORTFOLIO_DATA;

  return (
    <div>
      {/* Header */}
      <SectionHeader
        title="system info"
        icon={<BentoIcon size={16} />}
        iconColor="orange"
        subtitle="> query system"
        mono
        collapsible
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
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
            aria-label="Skills categories"
          >
            <div className="px-4 pb-4 space-y-4">
              <CategorySection category="hardware" skills={skills.hardware} onAskAI={onAskAI} isExpanded={isExpanded} />
              <CategorySection category="software" skills={skills.software} onAskAI={onAskAI} isExpanded={isExpanded} />
              <CategorySection category="tools" skills={skills.tools} onAskAI={onAskAI} isExpanded={isExpanded} />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SkillsSection;
