'use client';

import { motion } from 'framer-motion';
import { sectionItem, staggerContainer, staggerItem } from '@/lib/animations';
import { PORTFOLIO_DATA } from '@/lib/portfolio-context';

const featuredProjects = PORTFOLIO_DATA.projects.filter(p => p.featured);

// Category-based gradient colors
const categoryGradients: Record<string, string> = {
  'Robotics': 'from-violet-600/40 to-purple-900/40',
  'AI & Robotics': 'from-orange-600/40 to-red-900/40',
  'VR/AR': 'from-emerald-600/40 to-teal-900/40',
  'Accessibility': 'from-blue-600/40 to-indigo-900/40',
  'Competition': 'from-amber-600/40 to-yellow-900/40',
  'Games': 'from-pink-600/40 to-rose-900/40',
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

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  category: string;
  github?: string;
  featured: boolean;
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const gradient = categoryGradients[project.category] || 'from-gray-600/40 to-gray-900/40';
  const icon = categoryIcons[project.category] || '📦';

  return (
    <motion.div
      variants={staggerItem}
      className="group"
    >
      <motion.div
        className="glass rounded-2xl overflow-hidden card-hover h-full flex flex-col"
        whileHover={{ y: -8 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Project Header/Gradient */}
        <div className="h-40 relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="text-5xl opacity-30"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              {icon}
            </motion.div>
          </div>
          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 text-xs font-medium bg-black/30 backdrop-blur-sm text-white rounded-full">
              {project.category}
            </span>
          </div>
          {/* Hover overlay with GitHub link */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm transition-colors flex items-center gap-2"
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
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-400 transition-colors">
            {project.name}
          </h3>
          <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-3">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 text-xs bg-violet-500/10 text-violet-300 rounded-md"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="px-2 py-1 text-xs bg-white/5 text-gray-500 rounded-md">
                +{project.technologies.length - 4}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FeaturedProjects({ onViewAll }: { onViewAll?: () => void }) {
  return (
    <section id="projects" className="py-16 md:py-24">
      <motion.div
        className="max-w-6xl mx-auto px-4 md:px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={staggerContainer}
      >
        {/* Section Header */}
        <motion.div variants={sectionItem} className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Featured Projects
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-violet-500 to-orange-500 rounded-full" />
          </div>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="hidden md:flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors"
            >
              View All Projects
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
        >
          {featuredProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </motion.div>

        {/* Mobile View All */}
        {onViewAll && (
          <motion.div variants={sectionItem} className="mt-8 text-center md:hidden">
            <button
              onClick={onViewAll}
              className="px-6 py-3 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-xl transition-colors"
            >
              View All Projects
            </button>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
