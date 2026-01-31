'use client';

import { motion } from 'framer-motion';
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
    <motion.div
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
      <motion.div
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
      </motion.div>
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
