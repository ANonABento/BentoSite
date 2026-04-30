import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import {
  getProjectCaseStudyBySlug,
  getProjectCaseStudyPath,
  getProjectCaseStudySlugs,
} from '@/lib/project-case-studies';
import {
  formatProjectDate,
  getProjectById,
  getProjectThumbnail,
} from '@/lib/projects-data';
import { getAbsoluteUrl } from '@/lib/seo';

interface ProjectCaseStudyPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getProjectCaseStudySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProjectCaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getProjectCaseStudyBySlug(slug);

  if (!caseStudy) {
    return {
      title: 'Project not found | bentOS',
    };
  }

  const project = getProjectById(caseStudy.projectId);
  const image = caseStudy.heroImage ?? (project ? getProjectThumbnail(project) : undefined);
  const path = getProjectCaseStudyPath(caseStudy);

  return {
    title: `${caseStudy.title} | bentOS`,
    description: caseStudy.summary,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: caseStudy.title,
      description: caseStudy.summary,
      type: 'article',
      url: getAbsoluteUrl(path),
      publishedTime: caseStudy.publishedAt,
      images: image ? [{ url: getAbsoluteUrl(image), alt: caseStudy.title }] : undefined,
    },
  };
}

export default async function ProjectCaseStudyPage({ params }: ProjectCaseStudyPageProps) {
  const { slug } = await params;
  const caseStudy = getProjectCaseStudyBySlug(slug);

  if (!caseStudy) notFound();

  const project = getProjectById(caseStudy.projectId);
  if (!project) notFound();

  const heroImage = caseStudy.heroImage ?? getProjectThumbnail(project);
  const completionDate = formatProjectDate(project.dateCompleted);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <article className="mx-auto flex w-full max-w-5xl flex-col px-5 py-8 sm:px-8 lg:px-10">
        <Link
          href="/projects"
          className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--glass-bg)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--interactive)] hover:text-[var(--text-primary)]"
        >
          <span aria-hidden="true">←</span>
          <span>Projects</span>
        </Link>

        <header className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--orange)]">
              {project.category}
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-[var(--text-primary)] sm:text-5xl">
              {caseStudy.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
              {caseStudy.summary}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--glass-bg)] p-4">
            <ProjectMeta label="Status" value={project.status} />
            <ProjectMeta label="Completed" value={completionDate ?? 'Active'} />
            <ProjectMeta label="Stack" value={`${project.technologies.length} tools`} />
            <ProjectMeta label="Project" value={project.name} />
          </dl>
        </header>

        {heroImage ? (
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-deep)]">
            <Image
              src={heroImage}
              alt={caseStudy.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 960px"
            />
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-2">
          {project.technologies.map((technology) => (
            <span
              key={technology}
              className="rounded-full border border-[var(--border)] bg-[var(--glass-bg)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
            >
              {technology}
            </span>
          ))}
        </div>

        <div className="markdown-content mt-10 max-w-none rounded-2xl border border-[var(--border)] bg-[var(--glass-bg)] p-5 text-[var(--text-secondary)] sm:p-8">
          <ReactMarkdown>{caseStudy.body}</ReactMarkdown>
        </div>
      </article>
    </main>
  );
}

function ProjectMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
