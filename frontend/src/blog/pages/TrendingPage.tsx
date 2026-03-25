import React, { useState, useEffect } from 'react';
import { Flame, Loader2 } from 'lucide-react';
import { BlogLayout } from '../components/layout';
import { MasonryBlogCard } from '../components/cards';
import { MasonryGrid } from '../components/layout/MasonryGrid';
import { MasonrySkeletonGrid } from '../components/shared/MasonryCardSkeleton';
import { blogPostsService } from '../services/blog-portal.service';
import type { BlogPost } from '../types';

/**
 * TrendingPage - Shows trending posts sorted by popularity with Pinterest-style masonry layout
 *
 * Features:
 * - Header with trending icon
 * - Pinterest-style masonry grid with scroll-reveal animations
 * - Variable height cards based on aspect ratios
 * - Load more pagination
 * - Popularity sort indicator
 */
export function TrendingPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);

  const BATCH_SIZE = 12;

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const trendingPosts = await blogPostsService.getTrending(BATCH_SIZE);
        setPosts(trendingPosts);
        setLoadedCount(trendingPosts.length);
        // The trending endpoint returns up to the limit — if fewer, no more
        setHasMore(trendingPosts.length >= BATCH_SIZE);
      } catch (err) {
        console.error('Error fetching trending posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const nextBatch = await blogPostsService.getTrending(loadedCount + BATCH_SIZE);
      // The API returns all trending up to the limit, so we take the new ones
      const newPosts = nextBatch.slice(loadedCount);
      setPosts((prev) => [...prev, ...newPosts]);
      setLoadedCount(loadedCount + newPosts.length);
      setHasMore(newPosts.length >= BATCH_SIZE);
    } catch (err) {
      console.error('Error loading more:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <BlogLayout>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#1A1A2E] flex items-center justify-center">
              <Flame className="h-6 w-6 text-[#B8860B]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1A1A2E]">Trending</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Sorted by popularity
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <MasonrySkeletonGrid count={8} />
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Flame className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">No trending posts yet</h3>
            <p className="text-gray-500 mt-1">
              Check back soon for popular articles.
            </p>
          </div>
        ) : (
          <>
            {/* Trending posts - Pinterest-style masonry grid sorted by popularity */}
            <MasonryGrid>
              {posts.map((post, index) => (
                <MasonryBlogCard key={post._id} post={post} index={index} />
              ))}
            </MasonryGrid>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 rounded-lg text-[#1A1A2E] hover:bg-gray-50 hover:border-gray-300 font-medium transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : null}
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </BlogLayout>
  );
}

export default TrendingPage;
