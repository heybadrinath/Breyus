import React from 'react';

/**
 * BlogCardSkeleton - Loading placeholder for blog cards
 * Simple uniform card skeleton for the grid layout
 */
export function MasonryCardSkeleton() {
  return (
    <div className="blog-card animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[16/10] bg-gray-200" />

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Category badge */}
        <div className="w-20 h-5 bg-gray-200 rounded-full" />

        {/* Title lines */}
        <div className="space-y-2">
          <div className="w-full h-5 bg-gray-200 rounded" />
          <div className="w-4/5 h-5 bg-gray-200 rounded" />
        </div>

        {/* Excerpt line */}
        <div className="w-11/12 h-4 bg-gray-100 rounded" />

        {/* Author row */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <div className="w-7 h-7 rounded-full bg-gray-200" />
          <div className="w-24 h-4 bg-gray-200 rounded" />
        </div>

        {/* Meta row */}
        <div className="flex gap-4">
          <div className="w-20 h-3 bg-gray-100 rounded" />
          <div className="w-14 h-3 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * BlogSkeletonGrid - Grid of skeleton cards
 */
interface MasonrySkeletonGridProps {
  count?: number;
}

export function MasonrySkeletonGrid({ count = 6 }: MasonrySkeletonGridProps) {
  return (
    <div className="blog-grid">
      {Array.from({ length: count }).map((_, i) => (
        <MasonryCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Alias for clarity
export const BlogCardSkeleton = MasonryCardSkeleton;
export const BlogSkeletonGrid = MasonrySkeletonGrid;

export default MasonryCardSkeleton;
