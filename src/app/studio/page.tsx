import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjects } from '@/lib/content';
import { getLayout, infoContent, introProfile, projectCard } from '@/lib/board';
import { Studio } from './Studio';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Studio', robots: { index: false } };

const IMAGE = /\.(png|jpe?g|webp|avif|gif)$/i;

/** Images in a project's public folder, for the studio's image picker. */
function imagesFor(id: string): string[] {
  const dir = path.join(process.cwd(), 'public/projects', id);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => IMAGE.test(name))
    .sort()
    .map((name) => `/projects/${id}/${name}`);
}

/** Dev-only board editor: lay out the tile and frame each card. Saves to src/content/layout.json. */
export default function StudioPage() {
  if (process.env.NODE_ENV !== 'development') notFound();

  const projects = getProjects().map((p) => projectCard(p));
  const images = Object.fromEntries(getProjects().map((p) => [p.id, imagesFor(p.id)]));
  return <Studio initialLayout={getLayout()} projects={projects} images={images} profile={introProfile()} info={infoContent()} />;
}
