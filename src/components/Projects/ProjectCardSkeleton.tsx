// ProjectCardSkeleton - Loading placeholder for project cards

export function ProjectCardSkeleton() {
  return (
    <div
      className="backdrop-blur-xl rounded-2xl border border-[var(--border)] bg-[var(--glass-bg)] p-4 animate-pulse"
      aria-hidden="true"
    >
      {/* Thumbnail skeleton */}
      <div className="w-full h-36 bg-[var(--glass-bg)] rounded-xl mb-4" />

      {/* Status badge skeleton */}
      <div className="flex items-center justify-between mb-2">
        <div className="w-20 h-5 bg-[var(--glass-bg)] rounded-full" />
        <div className="w-16 h-4 bg-[var(--glass-bg)] rounded" />
      </div>

      {/* Title skeleton */}
      <div className="w-3/4 h-6 bg-[var(--glass-bg)] rounded mb-2" />

      {/* Description skeleton */}
      <div className="space-y-2 mb-3">
        <div className="w-full h-4 bg-[var(--glass-bg)] rounded" />
        <div className="w-2/3 h-4 bg-[var(--glass-bg)] rounded" />
      </div>

      {/* Tech badges skeleton */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <div className="w-14 h-5 bg-[var(--glass-bg)] rounded-full" />
        <div className="w-16 h-5 bg-[var(--glass-bg)] rounded-full" />
        <div className="w-12 h-5 bg-[var(--glass-bg)] rounded-full" />
        <div className="w-10 h-5 bg-[var(--glass-bg)] rounded-full" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border)]">
        <div className="w-16 h-7 bg-[var(--glass-bg)] rounded-lg" />
        <div className="w-18 h-7 bg-[var(--glass-bg)] rounded-lg" />
      </div>
    </div>
  );
}

export function ProjectCardSkeletonGrid({ count = 6, isMobile = false }: { count?: number; isMobile?: boolean }) {
  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
