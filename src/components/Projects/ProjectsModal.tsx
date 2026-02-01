// ProjectsModal - Full-screen modal for browsing portfolio projects
// Follows the model-selector.tsx pattern with glassmorphism theme

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PROJECTS, getAllCategories, searchProjects } from '@/lib/projects-data';
import type { ProjectCategory } from '@/lib/projects-data';
import { ProjectCard } from './ProjectCard';
import { staggerContainer, staggerItem, buttonTap } from '@/lib/animations';
import { useFocusTrap } from '@/lib/use-focus-trap';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad3DModel?: (modelPath: string) => void;
  isMobile?: boolean;
}

export function ProjectsModal({ isOpen, onClose, onLoad3DModel, isMobile = false }: ProjectsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'All'>('All');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus trap for accessibility
  const modalRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
    onEscape: onClose,
    initialFocusRef: searchInputRef,
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const categories = getAllCategories();
  const filteredProjects = searchTerm
    ? searchProjects(searchTerm, selectedCategory)
    : selectedCategory === 'All'
      ? PROJECTS
      : PROJECTS.filter((p) => p.category === selectedCategory);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="projects-modal-title"
          onClick={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={modalRef}
            className={`
              glass-strong rounded-2xl shadow-2xl overflow-hidden
              ${isMobile ? 'w-full h-full max-w-none rounded-none' : 'w-full max-w-5xl max-h-[90vh]'}
              flex flex-col
            `}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h2 id="projects-modal-title" className="text-xl font-bold text-[var(--text-primary)]">
                  Projects
                </h2>
                <motion.button
                  onClick={onClose}
                  whileTap={buttonTap}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150 p-2 rounded-lg hover:bg-[var(--glass-bg)] focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  aria-label="Close projects modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Search and filters */}
              <div className="space-y-4">
                {/* Search input */}
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[var(--glass-bg)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-150"
                    aria-label="Search projects by name, description, or technology"
                  />
                  <svg
                    className="absolute left-3 top-3.5 w-5 h-5 text-[var(--text-muted)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Category filters */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <motion.button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      whileTap={buttonTap}
                      className={`
                        px-4 py-2 rounded-full text-sm font-medium
                        transition-all duration-150 transform hover:scale-105
                        focus:outline-none focus:ring-2 focus:ring-violet-500/50
                        ${selectedCategory === category
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                          : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                        }
                      `}
                      aria-pressed={selectedCategory === category}
                    >
                      {category}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Projects grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-secondary)]">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <p className="text-lg font-medium mb-2">No projects found</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Try adjusting your search or category filter.
                  </p>
                </div>
              ) : (
                <motion.div
                  className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  key={`${searchTerm}-${selectedCategory}`}
                >
                  {filteredProjects.map((project) => (
                    <motion.div key={project.id} variants={staggerItem}>
                      <ProjectCard
                        project={project}
                        onLoad3DModel={onLoad3DModel}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Footer with count */}
            <div className="flex-shrink-0 px-6 py-3 border-t border-[var(--border)] bg-[var(--glass-bg)]">
              <p className="text-sm text-[var(--text-muted)]">
                Showing {filteredProjects.length} of {PROJECTS.length} projects
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
