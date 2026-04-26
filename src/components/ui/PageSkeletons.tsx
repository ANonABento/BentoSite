'use client';

import {
  AboutSectionSkeleton,
  ChatSkeleton,
  ProjectsSectionSkeleton,
  Skeleton,
  SkillsSkeleton,
  TimelineSectionSkeleton,
  ViewerSkeleton,
} from './Skeleton';

export function DashboardSkeleton() {
  return (
    <main className="relative h-screen overflow-hidden bg-atmosphere">
      <div className="flex h-screen flex-col">
        <div className="flex-shrink-0 p-4 md:p-6">
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton variant="rounded" className="h-11 w-11" />
                <div className="space-y-2">
                  <Skeleton variant="text" className="h-5 w-36" />
                  <Skeleton variant="text" className="h-3 w-48" />
                </div>
              </div>
              <div className="hidden gap-2 sm:flex">
                <Skeleton variant="rounded" className="h-9 w-20" />
                <Skeleton variant="rounded" className="h-9 w-24" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 px-4 pb-4 md:flex-row md:px-6 md:pb-6">
          <section className="glass-panel hidden min-h-0 overflow-hidden rounded-2xl md:flex md:w-1/2">
            <ViewerSkeleton />
          </section>

          <section className="glass-panel flex min-h-0 flex-1 overflow-hidden rounded-2xl md:hidden">
            <ViewerSkeleton />
          </section>

          <div className="hidden min-h-0 flex-col gap-5 md:flex md:w-1/2">
            <section className="glass-panel flex-shrink-0 rounded-2xl p-4">
              <SkillsSkeleton />
            </section>
            <section className="glass-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl">
              <div className="border-b border-[var(--border)] p-4">
                <Skeleton variant="text" className="h-4 w-36" />
              </div>
              <ChatSkeleton />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export function ProjectsGridSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--background)] bg-grid p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--glass-bg)] p-4">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-4 w-40" />
          <Skeleton variant="text" className="h-3 w-28" />
        </div>
        <Skeleton variant="rounded" className="h-9 w-20" />
      </div>
      <div className="relative h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--glass-bg)]">
        <div className="grid h-full grid-cols-1 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-[var(--border)] bg-[var(--glass-bg)] p-3"
            >
              <Skeleton variant="rounded" className="mb-3 h-28 w-full" />
              <Skeleton variant="text" className="mb-2 h-4 w-3/4" />
              <Skeleton variant="text" className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export function ScrollablePageSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--background)] bg-grid">
      <section className="min-h-screen px-4 py-16 md:px-6">
        <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_460px]">
          <div className="space-y-6">
            <Skeleton variant="text" className="h-4 w-40" />
            <Skeleton variant="rounded" className="h-16 w-full max-w-3xl" />
            <Skeleton variant="rounded" className="h-20 w-full max-w-2xl" />
            <div className="flex gap-3">
              <Skeleton variant="rounded" className="h-11 w-32" />
              <Skeleton variant="rounded" className="h-11 w-36" />
            </div>
          </div>
          <div className="glass-panel min-h-[420px] rounded-2xl">
            <ViewerSkeleton />
          </div>
        </div>
      </section>
      <AboutSectionSkeleton />
      <ProjectsSectionSkeleton />
      <TimelineSectionSkeleton />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <SkillsSkeleton />
        </div>
      </section>
    </main>
  );
}
