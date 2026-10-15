import fs from 'node:fs';
import path from 'node:path';
import type { BoardLayout, InfoContent, IntroProfile, LayoutCard, ProjectCardData } from '@/components/BentoGrid';
import { readingOrder, sizeOf } from '@/components/BentoGrid';
import type { ViewfinderItem, ViewfinderProject } from '@/components/Viewfinder/types';
import portfolio from '@/content/portfolio.json';
import { RESUME_URL, experience, formatDate, getFeatured, getJobs, getProjects, profile, skills, type Project } from './content';

export const LAYOUT_PATH = path.join(process.cwd(), 'src/content/layout.json');

/** The board layout saved by /studio. Read fresh each call so a save shows on the next load. */
export function getLayout(): BoardLayout {
  return JSON.parse(fs.readFileSync(LAYOUT_PATH, 'utf8')) as BoardLayout;
}

export function projectCard(p: Project, placed?: LayoutCard): ProjectCardData {
  const featured = getFeatured().some((f) => f.id === p.id);
  return {
    id: p.id,
    type: 'project',
    title: p.name,
    description: p.shortDescription,
    thumbnail: p.media.featuredImage,
    category: p.category,
    technologies: p.technologies,
    status: p.status,
    links: { github: p.links.github, demo: p.links.liveDemo },
    featured,
    award: p.award,
    awardShort: p.awardShort,
    date: p.period ?? formatDate(p.dateCompleted),
    size: placed ? sizeOf(placed) : '2x2',
    look: placed?.look,
  };
}

/** Projects on the board, in reading order so the mobile list follows the layout. */
export function boardProjects(layout: BoardLayout): ProjectCardData[] {
  const byId = new Map(getProjects().map((p) => [p.id, p]));
  return readingOrder(layout.cards).flatMap((placed) => {
    const p = byId.get(placed.id);
    return p ? [projectCard(p, placed)] : [];
  });
}

export function introProfile(): IntroProfile {
  return {
    name: profile.name,
    title: profile.title,
    pitch: 'I build robots and the software that runs them, from PCBs and printed joints up to ROS 2, teleop and on-device AI.',
    facts: [profile.location, `UWaterloo CE '${profile.gradYear.slice(2)}`, profile.workAuth],
    // Awards a recruiter should see without opening a card, best first.
    highlights: getProjects()
      .filter((p) => p.award && portfolio.highlights.includes(p.id))
      .sort((a, b) => portfolio.highlights.indexOf(a.id) - portfolio.highlights.indexOf(b.id))
      .map((p) => ({ id: p.id, label: p.awardShort ?? p.award! })),
    skills: [...skills.robotics, ...skills.ai].slice(0, 10),
    // The card has room for the recent roles; the full history is on the résumé.
    jobs: experience.slice(0, 4).map((e) => ({
      // Jobs with details have a card of their own; the row opens it.
      cardId: 'details' in e ? `job-${e.id}` : undefined,
      role: e.role,
      company: e.company,
      note: 'note' in e ? e.note : undefined,
      period: e.period,
      summary: e.summary,
    })),
  };
}

export function infoContent(): InfoContent {
  return { links: { resume: RESUME_URL, github: profile.github, linkedin: profile.linkedin, email: profile.email } };
}

/** The viewfinder's items for a project: its own list, or its images then its live demo. */
export function viewfinderItems(p: Project): ViewfinderItem[] {
  if (p.media.viewfinder?.length) return p.media.viewfinder;
  const images = [...new Set([p.media.featuredImage, ...(p.media.images ?? [])].filter((src): src is string => Boolean(src)))];
  const items: ViewfinderItem[] = images.map((src) => ({ kind: 'image', src }));
  if (p.links.liveDemo) items.push({ kind: 'embed', src: p.links.liveDemo, label: 'Live demo' });
  return items;
}

export function viewfinderProject(p: Project): ViewfinderProject {
  return {
    id: p.id,
    name: p.name,
    shortDescription: p.shortDescription,
    description: p.description,
    category: p.category,
    status: p.status,
    date: p.period ?? formatDate(p.dateCompleted),
    context: p.context,
    award: p.award,
    technologies: p.technologies,
    links: p.links,
    items: viewfinderItems(p),
  };
}

/** Every project's (and job's) viewfinder data, by id. */
export function viewfinderProjects(): Record<string, ViewfinderProject> {
  return Object.fromEntries([...getProjects(), ...getJobs()].map((p) => [p.id, viewfinderProject(p)]));
}
