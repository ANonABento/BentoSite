'use client';

import { m } from 'framer-motion';
import { skeletonPulse } from '@/lib/animations';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  return (
    <m.div
      className={`bg-white/10 ${variantStyles[variant]} ${className}`}
      style={{ width, height }}
      variants={skeletonPulse}
      initial="initial"
      animate="animate"
    />
  );
}

// Pre-built skeleton patterns
export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton variant="circular" width={32} height={32} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-24" />
        <Skeleton variant="rounded" className="h-16 w-full" />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 space-y-4">
        <ChatMessageSkeleton />
        <ChatMessageSkeleton />
        <ChatMessageSkeleton />
      </div>
      <div className="p-4 border-t border-white/5">
        <Skeleton variant="rounded" className="h-12 w-full" />
      </div>
    </div>
  );
}

export function ViewerSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8">
      <m.div
        className="w-32 h-32 rounded-2xl bg-white/5 flex items-center justify-center"
        variants={skeletonPulse}
        initial="initial"
        animate="animate"
      >
        <svg
          className="w-16 h-16 text-white/20"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
          />
        </svg>
      </m.div>
      <div className="text-center space-y-2">
        <Skeleton variant="text" className="w-32 mx-auto" />
        <Skeleton variant="text" className="w-48 mx-auto h-3" />
      </div>
    </div>
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`glass rounded-2xl p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-24" />
          <Skeleton variant="text" className="w-16 h-3" />
        </div>
      </div>
      <Skeleton variant="rounded" className="h-20 w-full" />
    </div>
  );
}

export function SkillsSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <Skeleton variant="rounded" className="h-8 w-20" />
        <Skeleton variant="rounded" className="h-8 w-20" />
        <Skeleton variant="rounded" className="h-8 w-20" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" className="h-7 w-16" />
        ))}
      </div>
    </div>
  );
}

// Section-level skeletons for lazy-loaded sections
export function AboutSectionSkeleton() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="mb-12">
          <Skeleton variant="text" className="w-40 h-10 mb-4" />
          <Skeleton variant="rounded" className="w-20 h-1" />
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Bio Content */}
          <div className="space-y-6">
            <Skeleton variant="text" className="w-full h-6" />
            <Skeleton variant="text" className="w-4/5 h-6" />
            <Skeleton variant="text" className="w-full h-5" />
            <Skeleton variant="text" className="w-3/4 h-5" />
            <div className="grid grid-cols-3 gap-4 pt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" className="h-20" />
              ))}
            </div>
          </div>

          {/* Visual Element */}
          <Skeleton variant="rounded" className="h-72" />
        </div>
      </div>
    </section>
  );
}

export function TimelineSectionSkeleton() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="mb-12">
          <Skeleton variant="text" className="w-48 h-10 mb-4" />
          <Skeleton variant="rounded" className="w-20 h-1" />
        </div>

        {/* Timeline Items */}
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-6">
              <div className="flex flex-col items-center">
                <Skeleton variant="circular" width={12} height={12} />
                <Skeleton variant="rectangular" className="w-0.5 h-full mt-2" />
              </div>
              <div className="flex-1 glass rounded-xl p-6 space-y-3">
                <Skeleton variant="text" className="w-32 h-5" />
                <Skeleton variant="text" className="w-48 h-6" />
                <Skeleton variant="text" className="w-full h-4" />
                <Skeleton variant="text" className="w-3/4 h-4" />
                <div className="flex gap-2 pt-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} variant="rounded" className="h-6 w-14" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProjectsSectionSkeleton() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <Skeleton variant="text" className="w-52 h-10 mb-4" />
            <Skeleton variant="rounded" className="w-20 h-1" />
          </div>
          <Skeleton variant="rounded" className="w-32 h-8 hidden md:block" />
        </div>

        {/* Filter buttons */}
        <div className="mb-8 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" className="h-10 w-20" />
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl overflow-hidden">
              <Skeleton variant="rectangular" className="h-40" />
              <div className="p-6 space-y-3">
                <Skeleton variant="text" className="w-3/4 h-6" />
                <Skeleton variant="text" className="w-full h-4" />
                <Skeleton variant="text" className="w-2/3 h-4" />
                <div className="flex gap-2 pt-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} variant="rounded" className="h-6 w-14" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
