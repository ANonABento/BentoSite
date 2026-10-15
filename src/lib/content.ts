import fs from 'node:fs';
import path from 'node:path';
import portfolio from '@/content/portfolio.json';
import type { ViewfinderItem } from '@/components/Viewfinder/types';

export type Project = {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  status: 'Completed' | 'In Progress';
  technologies: string[];
  links: { github?: string; docs?: string; liveDemo?: string; site?: string };
  media: {
    featuredImage?: string;
    images?: string[];
    /** What the viewfinder shows, in order. Without it: the images, then the live demo. */
    viewfinder?: ViewfinderItem[];
  };
  /** Where it was built: a hackathon, course, job, or "Personal". */
  context?: string;
  /** Only awards a source actually states. */
  award?: string;
  /** The award in a few words, for card badges. */
  awardShort?: string;
  /** "YYYY" or "YYYY-MM" */
  dateCompleted: string;
  /** Shown instead of the date when set, e.g. a job's "Aug 2026 - Present". */
  period?: string;
};

const PROJECTS_DIR = path.join(process.cwd(), 'src/content/projects');

let cache: Project[] | undefined;

/** Every project, newest first. Cached in production; read fresh in dev so edits (and /studio saves) show on reload. */
export function getProjects(): Project[] {
  if (cache && process.env.NODE_ENV === 'production') return cache;
  cache = fs
    .readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf8');
      // Drafting notes must never ship to the public site.
      if (raw.includes('TODO(')) throw new Error(`${f} still contains a TODO note`);
      return JSON.parse(raw) as Project;
    })
    .sort((a, b) => b.dateCompleted.localeCompare(a.dateCompleted) || a.name.localeCompare(b.name));
  return cache;
}

export function getProject(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

/** Featured projects in the order listed in portfolio.json. */
export function getFeatured(): Project[] {
  return portfolio.featured.map((id) => {
    const project = getProject(id);
    if (!project) throw new Error(`portfolio.json features unknown project "${id}"`);
    return project;
  });
}

export function getCategories(): string[] {
  return [...new Set(getProjects().map((p) => p.category))].sort();
}

export function formatDate(date: string): string {
  const [year, month] = date.split('-');
  if (!month) return year;
  return new Date(Number(year), Number(month) - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

type Job = (typeof portfolio.experience)[number] & { details?: string; site?: string; images?: string[] };

/** Each job (with details) as a board card: it opens in the viewfinder like a project. */
export function getJobs(): Project[] {
  return (portfolio.experience as Job[]).flatMap((e) => {
    if (!e.details) return [];
    const images = e.images ?? [];
    return [
      {
        id: `job-${e.id}`,
        name: e.company,
        shortDescription: `${e.role}. ${e.summary}`,
        description: e.details,
        category: 'Experience',
        context: `${e.role}, ${e.location.split(',')[0]}`,
        status: 'Completed' as const,
        technologies: e.technologies,
        links: { site: e.site },
        media: { featuredImage: images[0], images },
        dateCompleted: e.period.slice(-4),
        period: e.period,
      },
    ];
  });
}

export const profile = portfolio.personal;
export const about = portfolio.about;
export const skills = portfolio.skills;
export const experience = portfolio.experience;
export const education = portfolio.education;

export const RESUME_URL =
  'https://docs.google.com/document/d/140poL_mXjYyzeCwDNUE6Fs4U9zUKyypF3m4gpUiO1ZU/export?format=pdf';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');
