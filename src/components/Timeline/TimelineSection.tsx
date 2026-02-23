'use client';

import { m } from 'framer-motion';
import { sectionItem, staggerContainer, staggerItem } from '@/lib/animations';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';

interface TimelineItem {
  id: string;
  title: string;
  company: string;
  location: string;
  period: string;
  description: string;
  technologies: string[];
  type: 'work' | 'education';
}

// Transform experience data into timeline items
const timelineData: TimelineItem[] = [
  ...PORTFOLIO_DATA.experience.map((exp) => ({
    id: exp.id,
    title: exp.role,
    company: exp.company,
    location: exp.location,
    period: exp.period,
    description: exp.description,
    technologies: exp.technologies,
    type: 'work' as const,
  })),
  ...PORTFOLIO_DATA.education.map((edu) => ({
    id: edu.id,
    title: edu.degree,
    company: edu.institution,
    location: edu.location,
    period: edu.period,
    description: '',
    technologies: [],
    type: 'education' as const,
  })),
];

function TimelineCard({ item, index }: { item: TimelineItem; index: number }) {
  const isLeft = index % 2 === 0;

  return (
    <m.div
      variants={staggerItem}
      className={`flex items-center gap-4 md:gap-8 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
    >
      {/* Content */}
      <m.div
        className={`flex-1 ${isLeft ? 'md:text-right' : 'md:text-left'}`}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="glass rounded-xl p-6 card-hover">
          <div className={`flex items-center gap-2 mb-2 flex-wrap ${isLeft ? 'md:justify-end' : ''}`}>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              item.type === 'work'
                ? 'bg-[var(--purple-muted)] text-[var(--purple)]'
                : 'bg-[var(--orange-muted)] text-[var(--orange)]'
            }`}>
              {item.type === 'work' ? 'Work' : 'Education'}
            </span>
            <span className="text-sm text-[var(--text-muted)]">{item.period}</span>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{item.title}</h3>
          <p className="text-[var(--interactive)] text-sm mb-1">{item.company}</p>
          <p className="text-[var(--text-muted)] text-xs mb-3">{item.location}</p>
          {item.description && (
            <p className="text-[var(--text-secondary)] text-sm mb-4">{item.description}</p>
          )}
          {item.technologies.length > 0 && (
            <div className={`flex flex-wrap gap-2 ${isLeft ? 'md:justify-end' : ''}`}>
              {item.technologies.map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 text-xs bg-[var(--glass-bg)] text-[var(--text-secondary)] rounded-md border border-[var(--border)]"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </m.div>

      {/* Center line and dot */}
      <div className="hidden md:flex flex-col items-center">
        <m.div
          className={`w-4 h-4 rounded-full border-4 border-[var(--background)] z-10 ${
            item.type === 'work' ? 'bg-[var(--purple)]' : 'bg-[var(--orange)]'
          }`}
          whileHover={{ scale: 1.5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
      </div>

      {/* Spacer for alternating layout */}
      <div className="hidden md:block flex-1" />
    </m.div>
  );
}

export function TimelineSection() {
  return (
    <section id="experience" className="py-16 md:py-24">
      <m.div
        className="max-w-6xl mx-auto px-4 md:px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        {/* Section Header */}
        <m.div variants={sectionItem} className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Experience & Education
          </h2>
          <div className="w-20 h-1 rounded-full mx-auto" style={{ background: 'linear-gradient(to right, var(--purple), var(--orange))' }} />
        </m.div>

        {/* Timeline */}
        <div className="relative">
          {/* Center line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: 'linear-gradient(to bottom, var(--purple-muted), var(--border), var(--orange-muted))' }} />

          <m.div
            className="space-y-8 md:space-y-12"
            variants={staggerContainer}
          >
            {timelineData.map((item, index) => (
              <TimelineCard key={item.id} item={item} index={index} />
            ))}
          </m.div>
        </div>
      </m.div>
    </section>
  );
}
