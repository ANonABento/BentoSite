import { profile } from '@/lib/content';

const BUILT = new Date().toISOString().slice(0, 10);

export function SiteFooter() {
  return (
    <footer className="mt-24 flex flex-col gap-3 border-t border-wall py-8 text-sm text-ash sm:flex-row sm:items-center sm:justify-between">
      <p>
        Say hi at{' '}
        <a href={`mailto:${profile.email}`} className="text-rice underline decoration-orange underline-offset-4 hover:text-orange">
          {profile.email}
        </a>
      </p>
      <div className="flex items-center gap-5">
        <a href={profile.github} target="_blank" rel="noopener noreferrer" className="hover:text-rice">GitHub</a>
        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-rice">LinkedIn</a>
        <span className="font-crt text-base text-ash/70">bentOS 2.0 / {BUILT}</span>
      </div>
    </footer>
  );
}
