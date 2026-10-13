'use client';

/**
 * Viewfinder — a project opened over the board. The clicked card grows into
 * a large panel (media on the left, details on the right) and shrinks back
 * into it on close. Media comes in tabs: one gallery for all the images, and
 * a tab each for video, live pages, 3D models and PDFs.
 *
 * While it's open it takes the keyboard: Esc closes, ←/→ step through
 * images, and the board's own keys (WASD, R, /, arrows) are held back.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Markdown from 'react-markdown';
import { motion } from 'framer-motion';
import { ImageGallery } from './viewers/ImageGallery';
import { EmbedViewer, Fallback, PdfViewer, VideoViewer } from './viewers/FrameViewers';
import { tabsFor, type ViewfinderProject, type ViewfinderTab } from './types';

const ModelViewer = dynamic(() => import('./viewers/ModelViewer'), {
  ssr: false,
  loading: () => <Fallback text="Loading the 3D viewer…" />,
});

/** A screen rectangle, in px. */
export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ViewfinderProps {
  project: ViewfinderProject;
  /** The card it opened from, to grow out of and shrink back into. */
  origin: ScreenRect | null;
  onClose: () => void;
}

const LINK_LABELS = { github: 'Source', docs: 'Write-up', liveDemo: 'Live' } as const;
const EASE = [0.2, 0.8, 0.2, 1] as const;

function categoryColor(category: string) {
  return `var(--cat-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}, var(--color-ash))`;
}

/** Where the panel sits: centred with a margin, or the whole screen on a phone. */
function panelRect(): ScreenRect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (vw < 768) return { x: 0, y: 0, width: vw, height: vh };
  const width = Math.min(1280, vw - 64);
  const height = Math.min(820, vh - 64);
  return { x: (vw - width) / 2, y: (vh - height) / 2, width, height };
}

export function Viewfinder({ project, origin, onClose }: ViewfinderProps) {
  const tabs = useMemo(() => tabsFor(project.items), [project.items]);
  const [tabKey, setTabKey] = useState(tabs[0]?.key);
  const [imageIndex, setImageIndex] = useState(0);
  const tab = tabs.find((t) => t.key === tabKey) ?? tabs[0];
  const [target] = useState(panelRect);
  const from = origin ?? { x: target.x + target.width * 0.1, y: target.y + target.height * 0.1, width: target.width * 0.8, height: target.height * 0.8 };
  const closeRef = useRef<HTMLButtonElement>(null);

  // Take the keyboard from the board while open.
  const gallery = tab?.kind === 'image' ? tab.items.length : 0;
  // It lets go as soon as it starts closing (the exit animation keeps it
  // mounted a moment longer), and never holds back ⌘/Ctrl shortcuts.
  const closing = useRef(false);
  const close = useCallback(() => {
    closing.current = true;
    onClose();
  }, [onClose]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (closing.current || event.key === 'Tab' || event.metaKey || event.ctrlKey) return;
      event.stopPropagation();
      if (event.key === 'Escape') close();
      if (gallery > 1 && event.key === 'ArrowRight') setImageIndex((i) => (i + 1) % gallery);
      if (gallery > 1 && event.key === 'ArrowLeft') setImageIndex((i) => (i - 1 + gallery) % gallery);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [close, gallery]);

  useEffect(() => closeRef.current?.focus({ preventScroll: true }), []);

  const links = (Object.keys(LINK_LABELS) as (keyof typeof LINK_LABELS)[]).filter((key) => project.links[key]);
  const hue = categoryColor(project.category);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={project.name}>
      <motion.div
        className="absolute inset-0 bg-lacquer/75 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={close}
      />
      <motion.div
        className="absolute overflow-hidden bg-wall shadow-[0_30px_80px_rgb(0_0_0/0.6)]"
        style={{ borderRadius: 18 }}
        initial={{ left: from.x, top: from.y, width: from.width, height: from.height }}
        animate={{ left: target.x, top: target.y, width: target.width, height: target.height }}
        exit={{ left: from.x, top: from.y, width: from.width, height: from.height, opacity: origin ? 1 : 0 }}
        transition={{ duration: 0.38, ease: EASE }}
      >
        {/* Laid out at the final size, so growing never reflows it. */}
        <motion.div
          className="grid h-full gap-1.5 p-1.5 max-md:grid-rows-[minmax(0,45%)_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(0,380px)]"
          style={{ width: target.width, height: target.height }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.25 } }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
        >
          {/* Media */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-[13px] bg-lacquer">
            {tabs.length > 1 && (
              <nav className="flex shrink-0 gap-1 p-2" aria-label="Media">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTabKey(t.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      t.key === tab?.key ? 'bg-orange text-lacquer' : 'bg-cell-raised text-ash hover:text-rice'
                    }`}
                  >
                    {t.label}
                    {t.kind === 'image' && t.items.length > 1 ? <span className="ml-1 opacity-60">{t.items.length}</span> : null}
                  </button>
                ))}
              </nav>
            )}
            <div className="min-h-0 flex-1">
              {tab ? <TabViewer tab={tab} project={project} imageIndex={imageIndex} onImageIndex={setImageIndex} /> : <Fallback text="Nothing to show for this one yet." />}
            </div>
          </section>

          {/* Details */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-[13px] bg-cell">
            <header className="flex shrink-0 items-start justify-between gap-3 p-5 pb-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-[0.08em]" style={{ color: hue }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: hue }} />
                  {project.category}
                </p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">{project.name}</h2>
                <p className="mt-1 font-crt text-lg leading-none text-ash">
                  {project.status === 'In Progress' ? <span className="text-purple">wip</span> : project.date.toLowerCase()}
                  {project.context && project.context !== 'Personal' ? ` · ${project.context.toLowerCase()}` : ''}
                </p>
                {project.award && <p className="mt-2 text-sm text-orange">★ {project.award}</p>}
              </div>
              <button
                ref={closeRef}
                onClick={close}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cell-raised text-ash hover:bg-orange hover:text-lacquer"
                aria-label="Close"
                title="Close (Esc)"
              >
                ✕
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5" data-wheel-scroll>
              {links.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2 text-sm">
                  {links.map((key, i) => (
                    <a
                      key={key}
                      href={project.links[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        i === 0
                          ? 'rounded-full bg-rice px-3.5 py-1.5 font-medium text-lacquer hover:bg-orange'
                          : 'rounded-full border border-wall px-3.5 py-1.5 hover:border-ash'
                      }
                    >
                      {LINK_LABELS[key]} ↗
                    </a>
                  ))}
                </div>
              )}
              <div className="prose-bento text-[0.95rem] leading-relaxed">
                <Markdown>{project.description}</Markdown>
              </div>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <li key={tech} className="rounded-md bg-cell-raised px-2 py-0.5 font-crt text-base leading-tight text-ash">
                    {tech.toLowerCase()}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </motion.div>
      </motion.div>
    </div>
  );
}

function TabViewer({
  tab,
  project,
  imageIndex,
  onImageIndex,
}: {
  tab: ViewfinderTab;
  project: ViewfinderProject;
  imageIndex: number;
  onImageIndex: (index: number) => void;
}) {
  const item = tab.items[0];
  switch (tab.kind) {
    case 'image':
      return <ImageGallery images={tab.items} index={imageIndex} onIndex={onImageIndex} alt={project.name} />;
    case 'video':
      return <VideoViewer src={item.src} />;
    case 'embed':
      return <EmbedViewer src={item.src} title={`${project.name}: ${tab.label}`} />;
    case 'pdf':
      return <PdfViewer src={item.src} title={`${project.name}: ${tab.label}`} />;
    case 'model':
      return <ModelViewer src={item.src} />;
  }
}
