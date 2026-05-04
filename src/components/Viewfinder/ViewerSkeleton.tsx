'use client';

/**
 * Loading skeleton shown while viewer components are being loaded.
 * Used as the loading state for dynamically imported viewers.
 */
export function ViewerSkeleton() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[var(--glass-bg)]">
      {/* Spinner */}
      <div className="w-10 h-10 border-2 border-[var(--primary-muted)] border-t-[var(--interactive)] rounded-full animate-spin mb-4" />

      {/* Loading text */}
      <span className="text-sm text-[var(--text-muted)]">Loading viewer...</span>

      {/* Skeleton lines for perceived progress */}
      <div className="mt-6 space-y-2 w-48">
        <div className="h-2 bg-[var(--glass-bg-strong)] rounded animate-pulse" />
        <div className="h-2 bg-[var(--glass-bg-strong)] rounded animate-pulse w-3/4" />
        <div className="h-2 bg-[var(--glass-bg-strong)] rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}
