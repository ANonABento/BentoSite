'use client';

import { motion } from 'framer-motion';
import { sectionItem, staggerContainer, staggerItem } from '@/lib/animations';

interface Project {
  id: string;
  title: string;
  description: string;
  image?: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
}

const featuredProjects: Project[] = [
  {
    id: '1',
    title: '3D Model Viewer',
    description: 'Interactive web-based 3D model viewer with STL support, camera controls, and performance optimization for mobile devices.',
    technologies: ['Three.js', 'React', 'TypeScript', 'WebGL'],
    liveUrl: '#',
    githubUrl: '#',
    featured: true,
  },
  {
    id: '2',
    title: 'AI Portfolio Assistant',
    description: 'Intelligent chatbot powered by Gemini AI that answers questions about my experience and projects.',
    technologies: ['Next.js', 'Gemini API', 'Streaming', 'Markdown'],
    liveUrl: '#',
    featured: true,
  },
  {
    id: '3',
    title: 'Robotics Control System',
    description: 'Real-time control system for industrial robots with sensor fusion and path planning algorithms.',
    technologies: ['Python', 'ROS', 'C++', 'OpenCV'],
    githubUrl: '#',
    featured: true,
  },
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <motion.div
      variants={staggerItem}
      className="group"
    >
      <motion.div
        className="glass rounded-2xl overflow-hidden card-hover h-full"
        whileHover={{ y: -8 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Project Image/Gradient */}
        <div className="h-48 relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${
            index === 0 ? 'from-violet-600/40 to-purple-900/40' :
            index === 1 ? 'from-orange-600/40 to-red-900/40' :
            'from-emerald-600/40 to-teal-900/40'
          }`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="text-6xl opacity-20"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              {index === 0 ? '🎨' : index === 1 ? '🤖' : '⚙️'}
            </motion.div>
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
              >
                Live Demo
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
              >
                GitHub
              </a>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-400 transition-colors">
            {project.title}
          </h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 text-xs bg-violet-500/10 text-violet-300 rounded-md"
              >
                {tech}
              </span>
            ))}
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
              View All
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
