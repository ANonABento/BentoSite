import { HomeGrid } from './_components/HomeGrid';
import type { CardSize, IntroProfile, ProjectCardData } from '@/components/BentoGrid';
import { RESUME_URL, about, experience, formatDate, getFeatured, getProjects, profile, skills } from '@/lib/content';

/**
 * Card footprint by importance, not image shape: a few fixed shapes give the
 * board a steady rhythm (everything is two rows tall), and images crop the
 * same way every time. Featured work gets the wide compartment.
 */
function sizeFor(featured: boolean): CardSize {
  return featured ? '3x2' : '2x2';
}

export default function Home() {
  const featured = getFeatured();
  const featuredIds = new Set(featured.map((p) => p.id));
  // Featured first so they claim the space around the intro.
  const ordered = [...featured, ...getProjects().filter((p) => !featuredIds.has(p.id))];

  const projects: ProjectCardData[] = ordered.map((p) => ({
    id: p.id,
    type: 'project',
    title: p.name,
    description: p.shortDescription,
    thumbnail: p.media.featuredImage,
    category: p.category,
    technologies: p.technologies,
    status: p.status,
    links: { github: p.links.github, demo: p.links.liveDemo },
    featured: featuredIds.has(p.id),
    award: p.award,
    date: formatDate(p.dateCompleted),
    size: sizeFor(featuredIds.has(p.id)),
  }));

  const intro: IntroProfile = {
    name: profile.name,
    title: profile.title,
    pitch: 'I build robots and the software that runs them, from PCBs and printed joints up to ROS2 and LLM pipelines.',
    current: `${experience[0].role} @ ${experience[0].company}`,
    projectCount: projects.length,
    links: { resume: RESUME_URL, github: profile.github, linkedin: profile.linkedin, email: profile.email },
  };

  const info = {
    jobs: experience.map((e) => ({ role: e.role, company: e.company, period: e.period })),
    about: about.split('\n\n')[0],
    skills: [...skills.hardware, ...skills.software].slice(0, 10),
  };

  return <HomeGrid projects={projects} profile={intro} info={info} techs={topTechnologies(ordered)} />;
}

/** Few enough that the tiles punctuate the projects rather than outnumber them. */
const MAX_TECH_TILES = 8;

/** The most-used technologies (two or more projects), most-used first. */
function topTechnologies(projects: { technologies: string[] }[]) {
  const counts = new Map<string, { name: string; count: number }>();
  for (const tech of projects.flatMap((p) => p.technologies)) {
    const entry = counts.get(tech.toLowerCase()) ?? { name: tech, count: 0 };
    entry.count++;
    counts.set(tech.toLowerCase(), entry);
  }
  return [...counts.values()]
    .filter((t) => t.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_TECH_TILES);
}
