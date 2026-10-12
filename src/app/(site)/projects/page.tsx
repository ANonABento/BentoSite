import type { Metadata } from 'next';
import { ProjectIndex } from '@/components/ProjectIndex';
import { getCategories, getProjects } from '@/lib/content';

export const metadata: Metadata = { title: 'All projects' };

export default function ProjectsPage() {
  const projects = getProjects();
  const rows = projects.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    status: p.status,
    year: p.dateCompleted.slice(0, 4),
  }));
  return (
    <>
      <h1 className="mb-5 px-1 text-3xl font-semibold tracking-tight">All projects</h1>
      <div className="tray">
        <ProjectIndex rows={rows} categories={getCategories()} />
      </div>
    </>
  );
}
