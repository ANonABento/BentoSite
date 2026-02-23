'use client';

import { useState, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { sectionItem, staggerContainer, staggerItem } from '@/lib/animations';
import { PORTFOLIO_DATA, type PortfolioProject } from '@/lib/portfolio-context';

const allFeaturedProjects = PORTFOLIO_DATA.projects.filter(p => p.featured);

// Get unique technologies from all featured projects
const allTechnologies = Array.from(
  new Set(allFeaturedProjects.flatMap(p => p.technologies))
).sort();

// Category-based gradient colors
const categoryGradients: Record<string, string> = {
  'Robotics': 'linear-gradient(135deg, var(--purple-muted), var(--overlay-weak))',
  'AI & Robotics': 'linear-gradient(135deg, var(--orange-muted), var(--purple-muted))',
  'VR/AR': 'linear-gradient(135deg, var(--status-info-muted), var(--purple-muted))',
  'Accessibility': 'linear-gradient(135deg, var(--status-info-muted), var(--overlay-weak))',
  'Competition': 'linear-gradient(135deg, var(--status-warning-muted), var(--orange-muted))',
  'Games': 'linear-gradient(135deg, var(--status-error-muted), var(--purple-muted))',
};

// Category icons
const categoryIcons: Record<string, string> = {
  'Robotics': '🦾',
  'AI & Robotics': '🤖',
  'VR/AR': '🥽',
  'Accessibility': '♿',
  'Competition': '🏆',
  'Games': '🎮',
};

function ProjectCard({ project }: { project: PortfolioProject }) {
  const gradient = categoryGradients[project.category] || 'linear-gradient(135deg, var(--glass-bg), var(--overlay-weak))';
  const icon = categoryIcons[project.category] || '📦';

  return (
    <m.div
      layout
      variants={staggerItem}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <m.div
        className="glass rounded-2xl overflow-hidden card-hover h-full flex flex-col"
        whileHover={{ y: -8 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Project Header/Gradient */}
        <div className="h-40 relative overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: gradient }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <m.div
              className="text-5xl opacity-30"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              {icon}
            </m.div>
          </div>
          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 text-xs font-medium bg-[var(--overlay-weak)] backdrop-blur-sm text-[var(--text-on-accent)] rounded-full">
              {project.category}
            </span>
          </div>
          {/* Hover overlay with GitHub link */}
          <div className="absolute inset-0 bg-[var(--overlay)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-strong)] backdrop-blur-sm rounded-lg text-[var(--text-on-accent)] text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                View on GitHub
              </a>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--interactive)] transition-colors">
            {project.name}
          </h3>
          <p className="text-[var(--text-secondary)] text-sm mb-4 flex-1 line-clamp-3">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 text-xs bg-[var(--purple-muted)] text-[var(--purple)] rounded-md"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="px-2 py-1 text-xs bg-[var(--glass-bg)] text-[var(--text-muted)] rounded-md">
                +{project.technologies.length - 4}
              </span>
            )}
          </div>
        </div>
      </m.div>
    </m.div>
  );
}

export function FeaturedProjects({ onViewAll }: { onViewAll?: () => void }) {
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  // Filter projects based on selected technology
  const filteredProjects = useMemo(() => {
    if (!selectedTech) return allFeaturedProjects;
    return allFeaturedProjects.filter(p => p.technologies.includes(selectedTech));
  }, [selectedTech]);

  // Get popular technologies (used in 2+ projects) for filter buttons
  const popularTechnologies = useMemo(() => {
    const techCounts = new Map<string, number>();
    allFeaturedProjects.forEach(p => {
      p.technologies.forEach(tech => {
        techCounts.set(tech, (techCounts.get(tech) || 0) + 1);
      });
    });
    return allTechnologies
      .filter(tech => (techCounts.get(tech) || 0) >= 1)
      .slice(0, 8); // Show up to 8 popular techs
  }, []);

  return (
    <section id="projects" className="py-16 md:py-24">
      <m.div
        className="max-w-6xl mx-auto px-4 md:px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        {/* Section Header */}
        <m.div variants={sectionItem} className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4">
              Featured Projects
            </h2>
            <div className="w-20 h-1 rounded-full" style={{ background: 'linear-gradient(to right, var(--purple), var(--orange))' }} />
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="hidden md:flex items-center gap-2 text-[var(--interactive)] hover:text-[var(--interactive-hover)] transition-colors"
            >
              View All Projects
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </m.div>

        {/* Technology Filter */}
        <m.div variants={sectionItem} className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTech(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedTech === null
                  ? 'bg-[var(--interactive)] text-[var(--text-on-accent)] shadow-lg shadow-[0_0_20px_var(--purple-muted)]'
                  : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--purple-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              All
            </button>
            {popularTechnologies.map((tech) => (
              <button
                key={tech}
                onClick={() => setSelectedTech(selectedTech === tech ? null : tech)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedTech === tech
                  ? 'bg-[var(--interactive)] text-[var(--text-on-accent)] shadow-lg shadow-[0_0_20px_var(--purple-muted)]'
                  : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--purple-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
          {selectedTech && (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} with {selectedTech}
            </p>
          )}
        </m.div>

        {/* Projects Grid */}
        <m.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </AnimatePresence>
        </m.div>

        {/* Mobile View All */}
        {onViewAll && (
          <m.div variants={sectionItem} className="mt-8 text-center md:hidden">
            <button
              onClick={onViewAll}
              className="px-6 py-3 bg-[var(--purple-muted)] hover:bg-[var(--purple)] hover:text-[var(--text-on-accent)] text-[var(--purple)] rounded-xl transition-colors"
            >
              View All Projects
            </button>
          </m.div>
        )}
      </m.div>
    </section>
  );
}
