import fs from 'node:fs';
import path from 'node:path';
import type { BoardLayout, InfoContent, IntroProfile, LayoutCard, ProjectCardData } from '@/components/BentoGrid';
import { readingOrder, sizeOf } from '@/components/BentoGrid';
import { RESUME_URL, about, experience, formatDate, getFeatured, getProjects, profile, skills, type Project } from './content';

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
    date: formatDate(p.dateCompleted),
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
    pitch: 'I build robots and the software that runs them, from PCBs and printed joints up to ROS2 and LLM pipelines.',
    // The first sentence is enough beside the pitch.
    about: about.split(/(?<=\.)\s/)[0],
    skills: [...skills.hardware, ...skills.software].slice(0, 10),
    jobs: experience.map((e) => ({ role: e.role, company: e.company, period: e.period })),
  };
}

export function infoContent(): InfoContent {
  return { links: { resume: RESUME_URL, github: profile.github, linkedin: profile.linkedin, email: profile.email } };
}
