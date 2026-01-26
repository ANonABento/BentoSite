'use client';

import React, { useState } from 'react';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';

type SkillCategory = 'hardware' | 'software' | 'tools';

interface SkillsSectionProps {
  onAskAI?: (skill: string) => void;
}

const categoryConfig: Record<SkillCategory, { label: string; color: string; icon: React.ReactNode }> = {
  hardware: {
    label: 'Hardware',
    color: 'cyan',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
  },
  software: {
    label: 'Software',
    color: 'indigo',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  tools: {
    label: 'Tools',
    color: 'violet',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    hardware: 'hover:border-cyan-500/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.25)]',
    software: 'hover:border-indigo-500/40 hover:shadow-[0_0_12px_rgba(99,102,241,0.25)]',
    tools: 'hover:border-violet-500/40 hover:shadow-[0_0_12px_rgba(139,92,246,0.25)]',
  };

  return (
    <button
      onClick={() => onAskAI?.(skill)}
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium
        bg-white/5 border border-white/10 text-gray-300
        transition-all duration-200 transform
        hover:scale-105 hover:bg-white/10 hover:text-white
        focus:outline-none focus:ring-2 focus:ring-indigo-500/50
        active:scale-95
        ${colorClasses[category]}
      `}
      aria-label={`Ask AI about ${skill}`}
    >
      {skill}
    </button>
  );
}

function CategorySection({
  category,
  skills,
  onAskAI
}: {
  category: SkillCategory;
  skills: string[];
  onAskAI?: (skill: string) => void;
}) {
  const config = categoryConfig[category];
  const textColorClass: Record<SkillCategory, string> = {
    hardware: 'text-cyan-400',
    software: 'text-indigo-400',
    tools: 'text-violet-400',
  };

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 ${textColorClass[category]}`}>
        {config.icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{config.label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <SkillPill key={skill} skill={skill} category={category} onAskAI={onAskAI} />
        ))}
      </div>
    </div>
  );
}

export function SkillsSection({ onAskAI }: SkillsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { skills } = PORTFOLIO_DATA;

  return (
    <div>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm font-medium text-white">My Skills</span>
          <span className="text-xs text-gray-500">click to ask AI</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-4 pb-4 space-y-4">
          <CategorySection category="hardware" skills={skills.hardware} onAskAI={onAskAI} />
          <CategorySection category="software" skills={skills.software} onAskAI={onAskAI} />
          <CategorySection category="tools" skills={skills.tools} onAskAI={onAskAI} />
        </div>
      </div>
    </div>
  );
}

export default SkillsSection;
