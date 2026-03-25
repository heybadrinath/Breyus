/**
 * BlogCardSkeleton - Loading placeholder for blog cards
 *
 * Provides a smooth loading experience while blog posts are being fetched.
 * Uses animated pulse effect to indicate loading state.
 */
export function BlogCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      {/* Cover Image Skeleton */}
      <div className="aspect-[16/9] bg-gray-200" />

      {/* Content Skeleton */}
      <div className="p-4">
        {/* Title */}
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />

        {/* Excerpt */}
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />

        {/* Meta */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-3 bg-gray-200 rounded w-12" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * BlogCardSkeletonGrid - Multiple skeleton cards for grid layouts
 */
export function BlogCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * FeaturedPostSkeleton - Loading placeholder for the hero/featured post
 */
export function FeaturedPostSkeleton() {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-200 animate-pulse">
      <div className="aspect-[21/9]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <div className="h-4 bg-white/30 rounded w-24 mb-3" />
        <div className="h-8 bg-white/30 rounded w-3/4 mb-2" />
        <div className="h-8 bg-white/30 rounded w-1/2 mb-4" />
        <div className="h-4 bg-white/30 rounded w-2/3 mb-6" />
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/30" />
          <div>
            <div className="h-4 bg-white/30 rounded w-32 mb-1" />
            <div className="h-3 bg-white/30 rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PostDetailSkeleton - Loading placeholder for full blog post page
 */
export function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      {/* Back link */}
      <div className="h-4 bg-gray-200 rounded w-24 mb-6" />

      {/* Categories */}
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-gray-200 rounded-full w-20" />
        <div className="h-6 bg-gray-200 rounded-full w-16" />
      </div>

      {/* Title */}
      <div className="h-10 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-10 bg-gray-200 rounded w-1/2 mb-6" />

      {/* Meta */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-48" />
        </div>
      </div>

      {/* Featured Image */}
      <div className="aspect-[16/9] bg-gray-200 rounded-xl mb-8" />

      {/* Content */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}

/**
 * WriterCardSkeleton - Loading placeholder for writer cards
 */
export function WriterCardSkeleton() {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-48" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="h-3 bg-gray-200 rounded w-16" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

export default BlogCardSkeleton;
