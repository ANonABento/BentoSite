import Image from 'next/image';
import Link from 'next/link';
import type { BoardCard } from '@/lib/board';

type CardOf<K extends BoardCard['kind']> = Extract<BoardCard, { kind: K }>;

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;

export function IntroCard({ card }: { card: CardOf<'intro'> }) {
  const lines: [string, string][] = [
    ['whoami', `${card.name.toLowerCase()}, ${card.title.toLowerCase()}`],
    ['status', card.current.toLowerCase()],
    ['ls ~/projects | wc -l', String(card.projectCount)],
  ];
  return (
    <div className="grid h-full gap-[var(--spacing-wall)] md:grid-cols-[1.15fr_1fr]">
      <div className="cell flex flex-col justify-between gap-8 p-6 md:p-8">
        <div>
          <h1 className="text-5xl font-semibold tracking-[-0.035em] md:text-[3.6rem] md:leading-[1]">{card.name}</h1>
          <p className="mt-4 max-w-[30ch] text-lg leading-snug text-rice/85">
            I build robots and the software that runs them, from PCBs and printed joints up to ROS2 and LLM pipelines.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <a
            href={card.links.resume}
            {...ext}
            className="rounded-full bg-orange px-4 py-1.5 font-medium text-lacquer hover:brightness-110"
          >
            Resume
          </a>
          <a href={card.links.github} {...ext} className="text-ash hover:text-rice">
            GitHub
          </a>
          <a href={card.links.linkedin} {...ext} className="text-ash hover:text-rice">
            LinkedIn
          </a>
          <a href={`mailto:${card.links.email}`} className="text-ash hover:text-rice">
            Email
          </a>
        </div>
      </div>
      <div className="cell crt crt-on flex min-h-64 flex-col justify-between p-5 md:p-6" aria-hidden="true">
        <div className="flex justify-between text-base text-phosphor/55">
          <span>ANonABento</span>
          <span className="text-purple">crt mode</span>
        </div>
        <div className="wordmark text-[3.4rem]">bentOS</div>
        <div className="space-y-0.5 text-lg leading-tight">
          {lines.map(([cmd, out]) => (
            <div key={cmd}>
              <div>
                <span className="text-orange">&gt;</span> {cmd}
              </div>
              <div className="text-phosphor/65">{out}</div>
            </div>
          ))}
          <div>
            <span className="text-orange">&gt;</span> <span className="cursor" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectCard({ card, priority }: { card: CardOf<'project'>; priority?: boolean }) {
  const { project } = card;
  const big = card.w * card.h >= 6;
  return (
    <Link href={`/projects/${project.id}`} className="compartment group flex h-full flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-cell-raised">
        {project.image ? (
          <Image
            src={project.image}
            alt=""
            fill
            draggable={false}
            sizes={`${card.w * 160}px`}
            className="compartment-image object-cover"
            priority={priority}
          />
        ) : (
          <div className="crt flex h-full items-center justify-center font-crt text-2xl text-phosphor">
            {project.name.toLowerCase()}
          </div>
        )}
      </div>
      <div className={`flex flex-col gap-1 ${big ? 'p-4' : 'px-3.5 py-3'}`}>
        <div className="flex items-baseline justify-between gap-3">
          <h2
            className={`truncate font-semibold tracking-tight group-hover:text-orange ${big ? 'text-lg' : 'text-[0.95rem]'}`}
          >
            {project.name}
          </h2>
          <span className="shrink-0 font-crt text-base text-ash">
            {project.inProgress ? <span className="text-purple">wip</span> : project.date.toLowerCase()}
          </span>
        </div>
        {big ? (
          <p className="line-clamp-2 text-sm text-ash">{project.blurb}</p>
        ) : (
          <p className="truncate text-xs text-ash">{project.category}</p>
        )}
      </div>
    </Link>
  );
}

export function ExperienceCard({ card }: { card: CardOf<'experience'> }) {
  return (
    <div className="flex h-full flex-col p-5">
      <h2 className="text-sm text-ash">Experience</h2>
      <ol className="mt-3 flex flex-1 flex-col justify-between gap-3">
        {card.jobs.map((job) => (
          <li key={job.company}>
            <p className="font-crt text-base leading-none text-ash">{job.period.toLowerCase()}</p>
            <p className="mt-1 text-sm leading-snug">
              <span className="font-semibold">{job.role}</span> <span className="text-ash">at</span> {job.company}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function AboutCard({ card }: { card: CardOf<'about'> }) {
  return (
    <div className="flex h-full flex-col justify-between gap-4 p-5">
      <p className="line-clamp-6 text-sm leading-relaxed text-rice/80">{card.text}</p>
      <p className="font-crt text-base leading-tight text-ash">{card.skills.join(' · ').toLowerCase()}</p>
    </div>
  );
}

export function ResumeCard({ card }: { card: CardOf<'resume'> }) {
  return (
    <a
      href={card.href}
      {...ext}
      className="flex h-full items-center justify-between rounded-[var(--radius-cell)] bg-orange px-5 text-lacquer transition-[filter] hover:brightness-110"
    >
      <span className="text-xl font-semibold tracking-tight">Resume</span>
      <span className="font-crt text-xl">pdf ↗</span>
    </a>
  );
}

export function TechCard({ card, active, onPick }: { card: CardOf<'tech'>; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      aria-label={`Filter projects using ${card.tech}`}
      className={`crt flex h-full w-full flex-col items-start justify-between rounded-[var(--radius-cell)] p-3 text-left transition-colors ${active ? 'ring-2 ring-orange ring-inset' : ''}`}
    >
      <span className="text-orange">×{card.count}</span>
      <span className="w-full truncate text-xl leading-none">{card.tech.toLowerCase()}</span>
    </button>
  );
}
