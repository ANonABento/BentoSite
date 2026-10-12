import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';
import { formatDate, getProject, getProjects } from '@/lib/content';

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = getProject((await params).id);
  if (!project) return {};
  return {
    title: project.name,
    description: project.shortDescription,
    openGraph: {
      title: project.name,
      description: project.shortDescription,
      images: project.media.featuredImage ? [project.media.featuredImage] : undefined,
    },
  };
}

const LINK_LABELS = { github: 'Source on GitHub', docs: 'Write-up', liveDemo: 'Live' } as const;

export default async function ProjectPage({ params }: Params) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const all = getProjects();
  const index = all.findIndex((p) => p.id === id);
  const next = all[(index + 1) % all.length];
  const gallery = (project.media.images ?? []).filter((src) => src !== project.media.featuredImage);
  const links = (Object.keys(LINK_LABELS) as (keyof typeof LINK_LABELS)[]).filter((k) => project.links[k]);

  return (
    <article>
      <Link href="/" className="mb-5 inline-block px-1 text-sm text-ash hover:text-rice">
        &larr; Back to the board
      </Link>

      <div className="tray lg:grid-cols-[1fr_17rem]">
        <header className="cell p-6 sm:p-10">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">{project.name}</h1>
          <p className="mt-4 max-w-[52ch] text-lg text-rice/85">{project.shortDescription}</p>
          {links.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              {links.map((k, i) => (
                <a
                  key={k}
                  href={project.links[k]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    i === 0
                      ? 'rounded-full bg-rice px-4 py-2 font-medium text-lacquer hover:bg-orange'
                      : 'rounded-full border border-wall px-4 py-2 hover:border-ash'
                  }
                >
                  {LINK_LABELS[k]}
                </a>
              ))}
            </div>
          )}
        </header>

        <dl className="cell crt grid content-start gap-4 p-6 text-xl leading-tight">
          {project.award && (
            <div>
              <dt className="text-phosphor/50">award</dt>
              <dd className="text-orange">{project.award.toLowerCase()}</dd>
            </div>
          )}
          {project.context && project.context !== 'Personal' && (
            <div>
              <dt className="text-phosphor/50">built at</dt>
              <dd>{project.context.toLowerCase()}</dd>
            </div>
          )}
          <div>
            <dt className="text-phosphor/50">status</dt>
            <dd className={project.status === 'In Progress' ? 'text-purple' : ''}>{project.status.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="text-phosphor/50">date</dt>
            <dd>{formatDate(project.dateCompleted).toLowerCase()}</dd>
          </div>
          <div>
            <dt className="text-phosphor/50">category</dt>
            <dd>{project.category.toLowerCase()}</dd>
          </div>
          <div>
            <dt className="text-phosphor/50">stack</dt>
            <dd className="text-phosphor/85">{project.technologies.join(', ').toLowerCase()}</dd>
          </div>
        </dl>

        {project.media.featuredImage && (
          <div className="cell relative overflow-hidden lg:col-span-2">
            <Image
              src={project.media.featuredImage}
              alt={project.name}
              width={1600}
              height={1000}
              sizes="(min-width: 1152px) 1140px, 100vw"
              className="max-h-[32rem] w-full object-contain"
              priority
            />
          </div>
        )}

        <div className={`cell p-6 sm:p-10 ${gallery.length ? '' : 'lg:col-span-2'}`}>
          <div className="prose-bento">
            <Markdown>{project.description}</Markdown>
          </div>
        </div>

        {gallery.length > 0 && (
          <div className="grid content-start gap-[var(--spacing-wall)]">
            {gallery.map((src) => (
              <div key={src} className="cell overflow-hidden">
                <Image src={src} alt="" width={800} height={600} sizes="272px" className="h-auto w-full" />
              </div>
            ))}
          </div>
        )}
      </div>

      <Link
        href={`/projects/${next.id}`}
        className="group mt-6 flex items-baseline justify-between gap-4 rounded-[var(--radius-tray)] border border-wall px-6 py-5 hover:border-ash"
      >
        <span className="text-sm text-ash">Next project</span>
        <span className="text-lg font-semibold group-hover:text-orange">{next.name}</span>
      </Link>
    </article>
  );
}
