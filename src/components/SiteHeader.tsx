import Link from 'next/link';
import { BentoIcon } from './BentoIcon';
import { RESUME_URL, profile } from '@/lib/content';

const linkClass = 'text-ash transition-colors hover:text-rice';

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 py-5">
      <Link href="/" className="flex items-center gap-2.5 font-medium tracking-tight">
        <BentoIcon size={22} />
        <span>{profile.name}</span>
      </Link>
      <nav aria-label="Main" className="flex items-center gap-4 text-sm sm:gap-6">
        <Link href="/" className={`${linkClass} hidden sm:inline`}>
          Grid
        </Link>
        <Link href="/projects" className={`${linkClass} hidden sm:inline`}>
          All projects
        </Link>
        <a href={profile.github} className={linkClass} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a
          href={RESUME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-orange px-3.5 py-1.5 font-medium text-lacquer transition-[filter] hover:brightness-110"
        >
          Resume
        </a>
      </nav>
    </header>
  );
}
