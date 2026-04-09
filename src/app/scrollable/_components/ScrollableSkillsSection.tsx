'use client';

import { ComponentType } from 'react';
import { m } from 'framer-motion';
import { sectionItem, sectionStagger } from '@/lib/animations';

interface ScrollableSkillsSectionProps {
  SkillsSection: ComponentType<{ onAskAI?: (skill: string) => void }>;
  instantTransition: { duration: number };
  onAskAboutSkill: (skill: string) => void;
  prefersReducedMotion: boolean;
}

export function ScrollableSkillsSection({
  SkillsSection,
  instantTransition,
  onAskAboutSkill,
  prefersReducedMotion,
}: ScrollableSkillsSectionProps) {
  return (
    <section id="skills" className="py-16 md:py-24">
      <m.div
        className="max-w-6xl mx-auto px-4 md:px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={sectionStagger}
        transition={prefersReducedMotion ? instantTransition : undefined}
      >
        <m.div variants={sectionItem} className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Skills & Technologies
          </h2>
          <div
            className="w-20 h-1 rounded-full"
            style={{
              background: 'linear-gradient(to right, var(--purple), var(--orange))',
            }}
          />
        </m.div>
        <m.div variants={sectionItem} className="glass rounded-2xl overflow-hidden">
          <SkillsSection onAskAI={onAskAboutSkill} />
        </m.div>
      </m.div>
    </section>
  );
}
