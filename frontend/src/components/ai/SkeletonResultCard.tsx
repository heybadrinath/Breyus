/**
 * SkeletonResultCard Component
 * Skeleton loader for AI result cards
 */

import React from 'react';

interface SkeletonResultCardProps {
  variant?: 'product' | 'partner';
}

export const SkeletonResultCard: React.FC<SkeletonResultCardProps> = ({
  variant = 'partner',
}) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm animate-pulse">
      <div className="flex gap-4">
        {/* Avatar/Image skeleton */}
        <div className={`${variant === 'product' ? 'w-24 h-24' : 'w-14 h-14'} bg-gray-200 rounded-lg skeleton-shimmer`} />

        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          {/* Title */}
          <div className="h-5 bg-gray-200 rounded w-3/4 skeleton-shimmer" />

          {/* Subtitle */}
          <div className="h-4 bg-gray-200 rounded w-1/2 skeleton-shimmer" />

          {/* Details */}
          <div className="flex gap-4">
            <div className="h-3 bg-gray-200 rounded w-20 skeleton-shimmer" />
            <div className="h-3 bg-gray-200 rounded w-24 skeleton-shimmer" />
          </div>

          {/* Tags/Scores */}
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded-full w-16 skeleton-shimmer" />
            <div className="h-6 bg-gray-200 rounded-full w-20 skeleton-shimmer" />
            <div className="h-6 bg-gray-200 rounded-full w-24 skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Actions skeleton */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
        <div className="h-10 bg-gray-200 rounded-lg w-28 skeleton-shimmer" />
        <div className="h-10 bg-gray-200 rounded-lg w-24 skeleton-shimmer" />
      </div>
    </div>
  );
};

/**
 * Multiple skeleton cards for list loading
 */
interface SkeletonResultListProps {
  count?: number;
  variant?: 'product' | 'partner';
}

export const SkeletonResultList: React.FC<SkeletonResultListProps> = ({
  count = 4,
  variant = 'partner',
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          style={{ animationDelay: `${index * 0.1}s` }}
          className="animate-fadeIn"
        >
          <SkeletonResultCard variant={variant} />
        </div>
      ))}
    </div>
  );
};

export default SkeletonResultCard;
