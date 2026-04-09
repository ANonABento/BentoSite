// ProjectsModal - Full-screen modal for browsing portfolio projects
// Follows the model-selector.tsx pattern with glassmorphism theme

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
  PROJECTS,
  getAllCategories,
  getFeaturedProjects,
  searchProjects,
} from '@/lib/projects-data';
import type { ProjectCategory, Project } from '@/lib/projects-data';
import { ProjectCard } from './ProjectCard';
import { staggerContainer, staggerItem, buttonTap } from '@/lib/animations';
import { useFocusTrap } from '@/lib/use-focus-trap';
import { BentoIcon } from '@/components/BentoOS/BentoIcon';
import { analytics } from '@/lib/analytics';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject?: (project: Project) => void;
  isMobile?: boolean;
}

export function ProjectsModal({ isOpen, onClose, onSelectProject, isMobile = false }: ProjectsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'All'>('All');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const featuredCount = getFeaturedProjects().length;

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
      analytics.projectsModalOpened();
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
        <m.div
          className="fixed inset-0 bg-[var(--overlay-strong)] backdrop-blur-md flex items-center justify-center p-4 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="projects-modal-title"
          onClick={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <m.div
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
            <div className="flex-shrink-0 border-b border-[var(--border)] px-6 py-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="mb-2 flex items-center gap-2 text-[var(--text-muted)]">
                    <BentoIcon size={18} />
                    <span className="text-[11px] font-mono uppercase tracking-[0.24em]">
                      Project archive
                    </span>
                  </div>
                  <h2 id="projects-modal-title" className="mb-2 text-2xl font-semibold text-[var(--text-primary)]">
                    Browse the full build archive.
                  </h2>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    Robotics systems, embedded hardware, VR prototypes, and software experiments all route through the same portfolio dataset now.
                  </p>
                </div>
                <m.button
                  onClick={onClose}
                  whileTap={buttonTap}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150 p-2 rounded-lg hover:bg-[var(--glass-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--interactive)] focus:ring-opacity-50"
                  aria-label="Close projects modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </m.button>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <ArchiveStat label="Projects" value={`${PROJECTS.length}`} />
                <ArchiveStat label="Featured" value={`${featuredCount}`} />
                <ArchiveStat label="Categories" value={`${categories.length - 1}`} />
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
                    className="w-full pl-10 pr-4 py-3 bg-[var(--glass-bg)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-[var(--interactive)] focus:ring-opacity-50 focus:border-[var(--interactive)] transition-all duration-150"
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
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((category) => (
                    <m.button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      whileTap={buttonTap}
                      className={`
                        rounded-full px-3 py-1.5 text-xs font-mono uppercase tracking-wider
                        transition-all duration-150
                        focus:outline-none focus:ring-2 focus:ring-[var(--interactive)] focus:ring-opacity-50
                        ${selectedCategory === category
                          ? 'bg-[var(--interactive)] text-[var(--text-on-accent)] border border-[var(--interactive)]'
                          : 'bg-transparent text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }
                      `}
                      aria-pressed={selectedCategory === category}
                    >
                      {category}
                    </m.button>
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
                <m.div
                  className={`grid gap-5 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  key={`${searchTerm}-${selectedCategory}`}
                >
                  {filteredProjects.map((project) => (
                    <m.div key={project.id} variants={staggerItem}>
                      <ProjectCard
                        project={project}
                        onSelectProject={onSelectProject}
                      />
                    </m.div>
                  ))}
                </m.div>
              )}
            </div>

            {/* Footer with count */}
            <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--glass-bg)] px-6 py-3">
              <p className="text-xs font-mono text-[var(--text-muted)]">
                {filteredProjects.length} entries
                {selectedCategory !== 'All' && <span> · category [{selectedCategory}]</span>}
                {searchTerm && <span> · search &quot;{searchTerm}&quot;</span>}
              </p>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

function ArchiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--glass-bg)] px-4 py-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}
