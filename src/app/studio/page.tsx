import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjects } from '@/lib/content';
import { getLayout, infoContent, introProfile, projectCard, viewfinderItems, viewfinderProject } from '@/lib/board';
import { Studio } from './Studio';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Studio', robots: { index: false } };

/** Files in a project's public folder: thumbnails, and anything the viewfinder can show. */
function filesFor(id: string): string[] {
  const dir = path.join(process.cwd(), 'public/projects', id);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .sort()
    .map((name) => `/projects/${id}/${name}`);
}

/** Dev-only board editor: lay out the tile and frame each card. Saves to src/content/layout.json. */
export default function StudioPage() {
  if (process.env.NODE_ENV !== 'development') notFound();

  const all = getProjects();
  const projects = all.map((p) => projectCard(p));
  const files = Object.fromEntries(all.map((p) => [p.id, filesFor(p.id)]));
  const details = Object.fromEntries(all.map((p) => [p.id, viewfinderProject(p)]));
  // What each project's viewfinder shows with no list of its own.
  const defaults = Object.fromEntries(all.map((p) => [p.id, viewfinderItems({ ...p, media: { ...p.media, viewfinder: undefined } })]));
  const custom = Object.fromEntries(all.map((p) => [p.id, Boolean(p.media.viewfinder?.length)]));
  return (
    <Studio
      initialLayout={getLayout()}
      projects={projects}
      files={files}
      details={details}
      viewfinderDefaults={defaults}
      viewfinderCustom={custom}
      profile={introProfile()}
      info={infoContent()}
    />
  );
}
