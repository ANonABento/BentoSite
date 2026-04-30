import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

export interface ProjectCaseStudy {
  slug: string;
  projectId: string;
  title: string;
  summary: string;
  heroImage?: string;
  publishedAt?: string;
  body: string;
}

type CaseStudyFrontmatter = Partial<Omit<ProjectCaseStudy, 'slug' | 'body'>>;
export type ProjectCaseStudyPathMap = Record<string, string>;

const CASE_STUDY_DIRECTORY = path.join(process.cwd(), 'content', 'projects');
const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?/;

export function getProjectCaseStudySlugs(): string[] {
  try {
    return readdirSync(CASE_STUDY_DIRECTORY)
      .filter((fileName) => fileName.endsWith('.mdx'))
      .map((fileName) => fileName.replace(/\.mdx$/, ''))
      .sort();
  } catch {
    return [];
  }
}

export function getAllProjectCaseStudies(): ProjectCaseStudy[] {
  return getProjectCaseStudySlugs()
    .map(getProjectCaseStudyBySlug)
    .filter((caseStudy): caseStudy is ProjectCaseStudy => Boolean(caseStudy));
}

export function getProjectCaseStudyBySlug(slug: string): ProjectCaseStudy | null {
  if (!isSafeSlug(slug)) return null;

  try {
    const filePath = path.join(CASE_STUDY_DIRECTORY, `${slug}.mdx`);
    const source = readFileSync(filePath, 'utf8');
    const { frontmatter, body } = parseCaseStudySource(source);

    if (!frontmatter.projectId || !frontmatter.title || !frontmatter.summary) {
      return null;
    }

    return {
      slug,
      projectId: frontmatter.projectId,
      title: frontmatter.title,
      summary: frontmatter.summary,
      heroImage: frontmatter.heroImage,
      publishedAt: frontmatter.publishedAt,
      body,
    };
  } catch {
    return null;
  }
}

export function getCaseStudyPathForProject(projectId: string): string | null {
  const caseStudy = getAllProjectCaseStudies().find((entry) => entry.projectId === projectId);
  return caseStudy ? getProjectCaseStudyPath(caseStudy) : null;
}

export function getCaseStudyPathsByProjectId(): ProjectCaseStudyPathMap {
  return getAllProjectCaseStudies().reduce<ProjectCaseStudyPathMap>((paths, caseStudy) => {
    paths[caseStudy.projectId] = getProjectCaseStudyPath(caseStudy);
    return paths;
  }, {});
}

export function getProjectCaseStudyPath(caseStudy: Pick<ProjectCaseStudy, 'slug'>): string {
  return `/projects/${caseStudy.slug}`;
}

function parseCaseStudySource(source: string): {
  frontmatter: CaseStudyFrontmatter;
  body: string;
} {
  const match = source.match(FRONTMATTER_PATTERN);
  if (!match) {
    return {
      frontmatter: {},
      body: source.trim(),
    };
  }

  return {
    frontmatter: parseFrontmatter(match[1] ?? ''),
    body: source.slice(match[0].length).trim(),
  };
}

function parseFrontmatter(source: string): CaseStudyFrontmatter {
  return source.split('\n').reduce<CaseStudyFrontmatter>((metadata, line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) return metadata;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');

    if (isCaseStudyFrontmatterKey(key)) {
      metadata[key] = value;
    }

    return metadata;
  }, {});
}

function isCaseStudyFrontmatterKey(key: string): key is keyof CaseStudyFrontmatter {
  return ['projectId', 'title', 'summary', 'heroImage', 'publishedAt'].includes(key);
}

function isSafeSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}
