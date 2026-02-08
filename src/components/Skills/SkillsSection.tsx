'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';
import { staggerFast, scaleIn, buttonTap } from '@/lib/animations';
import { SectionHeader } from '@/components/ui/SectionHeader';

type SkillCategory = 'hardware' | 'software' | 'tools';

interface SkillsSectionProps {
  onAskAI?: (skill: string) => void;
}

const categoryConfig: Record<SkillCategory, { label: string; color: string; icon: React.ReactNode }> = {
  hardware: {
    label: 'Hardware',
    color: 'orange',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
  software: {
    label: 'Software',
    color: 'violet',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  tools: {
    label: 'Tools',
    color: 'gray',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
};

function SkillPill({
  skill,
  category,
  onAskAI
}: {
  skill: string;
  category: SkillCategory;
  onAskAI?: (skill: string) => void;
}) {
  const colorClasses: Record<SkillCategory, string> = {
    hardware: 'hover:border-[var(--orange)]/40 hover:shadow-[0_0_12px_var(--orange-muted)]',
    software: 'hover:border-[var(--purple)]/40 hover:shadow-[0_0_12px_var(--purple-muted)]',
    tools: 'hover:border-gray-400/40 hover:shadow-[0_0_12px_rgba(156,163,175,0.15)]',
  };

  return (
    <motion.button
      onClick={() => onAskAI?.(skill)}
      whileTap={buttonTap}
      className={`
        px-3 py-1.5 rounded-sm text-xs font-medium
        bg-[var(--glass-bg)] border border-[var(--border)] text-[var(--text-secondary)]
        transition-all duration-200 transform
        hover:scale-105 hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)]
        focus:outline-none focus:ring-2 focus:ring-violet-500/50
        active:scale-95
        ${colorClasses[category]}
      `}
      aria-label={`Ask AI about ${skill}`}
    >
      {skill}
    </motion.button>
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
    tools: 'text-gray-400',
  };

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 ${textColorClass[category]}`}>
        {config.icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{config.label}</span>
      </div>
      <motion.div
        className="flex flex-wrap gap-2"
        variants={staggerFast}
        initial="hidden"
        animate={isExpanded ? 'visible' : 'hidden'}
      >
        {skills.map((skill) => (
          <motion.div key={skill} variants={scaleIn}>
            <SkillPill skill={skill} category={category} onAskAI={onAskAI} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export function SkillsSection({ onAskAI }: SkillsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { skills } = PORTFOLIO_DATA;

  // Lightning bolt icon for skills
  const skillsIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );

  return (
    <div>
      {/* Header */}
      <SectionHeader
        title="My Skills"
        icon={skillsIcon}
        iconColor="violet"
        subtitle="click to ask AI"
        collapsible
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SkillsSection;
