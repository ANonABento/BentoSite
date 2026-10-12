import { pack } from './pack';
import { RESUME_URL, about, experience, formatDate, getFeatured, getProjects, profile, skills } from './content';

/** Desktop tray width in grid units. */
const COLS = 18;

type Base = { key: string; col: number; row: number; w: number; h: number; mobileSpan: 1 | 2 };

export type ProjectCardData = {
  id: string;
  name: string;
  blurb: string;
  image?: string;
  date: string;
  category: string;
  inProgress: boolean;
  featured: boolean;
  /** Lowercased text the filter matches against. */
  search: string;
};

export type BoardCard = Base &
  (
    | { kind: 'intro'; name: string; title: string; current: string; projectCount: number; links: Links }
    | { kind: 'project'; project: ProjectCardData }
    | { kind: 'experience'; jobs: { role: string; company: string; period: string }[] }
    | { kind: 'about'; text: string; skills: string[] }
    | { kind: 'resume'; href: string }
    | { kind: 'tech'; tech: string; count: number }
    | { kind: 'empty' }
  );

type Links = { github: string; linkedin: string; email: string; resume: string };

export type Board = { cols: number; rows: number; cards: BoardCard[]; categories: string[] };

export function buildBoard(): Board {
  const projects = getProjects();
  const featuredIds = new Set(getFeatured().map((p) => p.id));
  const toCard = (p: (typeof projects)[number]): ProjectCardData => ({
    id: p.id,
    name: p.name,
    blurb: p.shortDescription,
    image: p.media.featuredImage,
    date: formatDate(p.dateCompleted),
    category: p.category,
    inProgress: p.status === 'In Progress',
    featured: featuredIds.has(p.id),
    search: [p.name, p.shortDescription, p.category, ...p.technologies].join(' ').toLowerCase(),
  });

  // Priority order = distance from the centre. Keystone first, then featured
  // work, then the info compartments, then everything else newest first.
  type Item = Omit<Base, 'col' | 'row'> & { fixed?: boolean; card: DistributiveOmit<BoardCard, keyof Base> };
  const items: Item[] = [
    {
      key: 'intro',
      w: 5,
      h: 3,
      mobileSpan: 2,
      card: {
        kind: 'intro',
        name: profile.name,
        title: profile.title,
        current: `${experience[0].role} @ ${experience[0].company}`,
        projectCount: projects.length,
        links: { github: profile.github, linkedin: profile.linkedin, email: profile.email, resume: RESUME_URL },
      },
    },
    ...getFeatured().map((p) => ({
      key: p.id,
      w: 3,
      h: 2,
      mobileSpan: 2 as const,
      card: { kind: 'project' as const, project: toCard(p) },
    })),
    {
      key: 'experience',
      w: 3,
      h: 3,
      mobileSpan: 2,
      card: {
        kind: 'experience',
        jobs: experience.map((e) => ({ role: e.role, company: e.company, period: e.period })),
      },
    },
    {
      key: 'about',
      w: 3,
      h: 2,
      fixed: true,
      mobileSpan: 2,
      card: {
        kind: 'about',
        text: about.split('\n\n')[0],
        skills: [...skills.hardware, ...skills.software].slice(0, 10),
      },
    },
    { key: 'resume', w: 2, h: 1, fixed: true, mobileSpan: 2, card: { kind: 'resume', href: RESUME_URL } },
    ...projects
      .filter((p) => !featuredIds.has(p.id))
      .map((p) => ({
        key: p.id,
        w: 2,
        h: 2,
        mobileSpan: 1 as const,
        card: { kind: 'project' as const, project: toCard(p) },
      })),
  ];

  const packed = pack(items, COLS);
  const byKey = new Map(items.map((i) => [i.key, i]));
  const cards: BoardCard[] = packed.placed.map((p) => {
    const item = byKey.get(p.key)!;
    return {
      ...item.card,
      key: p.key,
      col: p.col,
      row: p.row,
      w: p.w,
      h: p.h,
      mobileSpan: item.mobileSpan,
    } as BoardCard;
  });

  // Holes become tech tiles (most-used first, nearest the centre first), and
  // whatever is left over stays an empty compartment.
  const techs = topTechnologies(projects.flatMap((p) => p.technologies));
  const holes = [...packed.holes].sort(
    (a, b) => distance(a, packed.cols, packed.rows) - distance(b, packed.cols, packed.rows),
  );
  holes.forEach((hole, i) => {
    const tech = techs[i];
    const base = {
      key: `hole-${hole.col}-${hole.row}`,
      col: hole.col,
      row: hole.row,
      w: 1,
      h: 1,
      mobileSpan: 1 as const,
    };
    cards.push(tech ? { ...base, kind: 'tech', tech: tech.name, count: tech.count } : { ...base, kind: 'empty' });
  });

  const categories = [...new Set(projects.map((p) => p.category))].sort();
  return { cols: packed.cols, rows: packed.rows, cards, categories };
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

function distance(cell: { col: number; row: number }, cols: number, rows: number) {
  return Math.hypot((cell.col + 0.5 - cols / 2) / (cols / rows), cell.row + 0.5 - rows / 2);
}

function topTechnologies(all: string[]) {
  const counts = new Map<string, { name: string; count: number }>();
  for (const t of all) {
    const key = t.toLowerCase();
    const entry = counts.get(key) ?? { name: t, count: 0 };
    entry.count++;
    counts.set(key, entry);
  }
  return [...counts.values()].filter((t) => t.count >= 2).sort((a, b) => b.count - a.count);
}
