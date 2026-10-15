import type { Metadata } from 'next';
import { ProjectIndex } from '@/components/ProjectIndex';
import { getCategories, getFeatured, getProjects } from '@/lib/content';

export const metadata: Metadata = { title: 'All projects' };

export default function ProjectsPage() {
  // Selected work first, in its featured order, then everything else newest first.
  const featured = getFeatured();
  const projects = [...featured, ...getProjects().filter((p) => !featured.includes(p))];
  const rows = projects.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    status: p.status,
    year: p.dateCompleted.slice(0, 4),
    blurb: p.shortDescription,
    award: p.awardShort ?? p.award,
    thumbnail: p.media.featuredImage,
  }));
  return (
    <>
      <h1 className="px-1 text-3xl font-semibold tracking-tight">All projects</h1>
      <p className="mb-5 mt-1 px-1 text-ash">Robots, hardware and AI systems: selected work first, then the rest, newest first. Open one for photos, video and the write-up.</p>
      <div className="tray">
        <ProjectIndex rows={rows} categories={getCategories()} />
      </div>
    </>
  );
}
