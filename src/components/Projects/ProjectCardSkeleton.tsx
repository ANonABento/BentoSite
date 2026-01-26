// ProjectCardSkeleton - Loading placeholder for project cards

export function ProjectCardSkeleton() {
  return (
    <div
      className="backdrop-blur-xl rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse"
      aria-hidden="true"
    >
      {/* Thumbnail skeleton */}
      <div className="w-full h-36 bg-white/5 rounded-xl mb-4" />

      {/* Status badge skeleton */}
      <div className="flex items-center justify-between mb-2">
        <div className="w-20 h-5 bg-white/5 rounded-full" />
        <div className="w-16 h-4 bg-white/5 rounded" />
      </div>

      {/* Title skeleton */}
      <div className="w-3/4 h-6 bg-white/5 rounded mb-2" />

      {/* Description skeleton */}
      <div className="space-y-2 mb-3">
        <div className="w-full h-4 bg-white/5 rounded" />
        <div className="w-2/3 h-4 bg-white/5 rounded" />
      </div>

      {/* Tech badges skeleton */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <div className="w-14 h-5 bg-white/5 rounded-full" />
        <div className="w-16 h-5 bg-white/5 rounded-full" />
        <div className="w-12 h-5 bg-white/5 rounded-full" />
        <div className="w-10 h-5 bg-white/5 rounded-full" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
        <div className="w-16 h-7 bg-white/5 rounded-lg" />
        <div className="w-18 h-7 bg-white/5 rounded-lg" />
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
