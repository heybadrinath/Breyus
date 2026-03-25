import React, { ReactNode } from 'react';

/**
 * BlogGrid - Simple responsive CSS Grid layout
 *
 * A clean 3-column grid that adapts to screen size:
 * - Desktop (1024px+): 3 columns
 * - Tablet (640-1024px): 2 columns
 * - Mobile (<640px): 1 column
 *
 * @example
 * ```tsx
 * <BlogGrid>
 *   {posts.map((post, index) => (
 *     <BlogCard key={post._id} post={post} index={index} />
 *   ))}
 * </BlogGrid>
 * ```
 */
interface BlogGridProps {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function MasonryGrid({
  children,
  className = '',
}: BlogGridProps) {
  return (
    <div className={`blog-grid ${className}`}>
      {children}
    </div>
  );
}

// Alias for clarity
export const BlogGrid = MasonryGrid;

/**
 * MasonryItem - Kept for backwards compatibility
 */
interface MasonryItemProps {
  children: ReactNode;
  className?: string;
}

export function MasonryItem({ children, className = '' }: MasonryItemProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export default MasonryGrid;
