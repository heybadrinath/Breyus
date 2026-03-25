import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { BlogLayout } from '../components/layout';
import { MasonryBlogCard } from '../components/cards';
import { MasonryGrid } from '../components/layout/MasonryGrid';
import { MasonrySkeletonGrid } from '../components/shared/MasonryCardSkeleton';
import { blogPostsService } from '../services/blog-portal.service';
import type { BlogPost } from '../types';

// Category metadata
const CATEGORY_META: Record<string, { name: string; description: string }> = {
  commodities: {
    name: 'Commodities',
    description: 'Global commodity insights, pricing trends, and market updates.',
  },
  trading: {
    name: 'Trading',
    description: 'Trade strategies, best practices, and negotiation tips.',
  },
  'market-analysis': {
    name: 'Market Analysis',
    description: 'In-depth market analysis, forecasts, and expert opinions.',
  },
  sustainability: {
    name: 'Sustainability',
    description: 'Eco-friendly trading practices and sustainable supply chains.',
  },
  technology: {
    name: 'Technology',
    description: 'Tech innovations transforming commodity trading.',
  },
  logistics: {
    name: 'Logistics',
    description: 'Shipping, supply chain, and logistics insights.',
  },
  'global-trade': {
    name: 'Global Trade',
    description: 'International trade updates and cross-border commerce.',
  },
};

/**
 * BlogCategoryPage - Lists posts by category with Pinterest-style masonry layout
 *
 * Features:
 * - Category header with description
 * - Pinterest-style masonry grid with scroll-reveal animations
 * - Paginated results with load more
 * - Loading skeletons and empty states
 */
export function BlogCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const categoryMeta = category ? CATEGORY_META[category] : null;

  useEffect(() => {
    if (!category) return;

    const fetchPosts = async () => {
      setLoading(true);
      setPage(1);
      try {
        const response = await blogPostsService.search({
          query: '',
          category,
          page: 1,
          limit: 12,
        });
        setPosts(response.posts);
        setHasMore(response.hasMore);
        setTotal(response.total);
      } catch (err) {
        console.error('Error fetching category posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [category]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await blogPostsService.search({
        query: '',
        category,
        page: nextPage,
        limit: 12,
      });
      setPosts((prev) => [...prev, ...response.posts]);
      setPage(nextPage);
      setHasMore(response.hasMore);
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <BlogLayout>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-8">
        {/* Back Link */}
        <Link
          to="/blog"
          className="inline-flex items-center text-gray-600 hover:text-[#B8860B] mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Blog
        </Link>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {categoryMeta?.name || category}
          </h1>
          {categoryMeta?.description && (
            <p className="text-gray-600 mt-2 max-w-2xl">
              {categoryMeta.description}
            </p>
          )}
          {!loading && (
            <p className="text-sm text-gray-500 mt-2">
              {total} article{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <MasonrySkeletonGrid count={8} />
        ) : posts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <p className="text-gray-500">No articles found in this category.</p>
            <Link
              to="/blog"
              className="inline-flex items-center mt-4 text-[#B8860B] hover:text-[#9A7209] font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Return to homepage
            </Link>
          </div>
        ) : (
          /* Pinterest-style Masonry Grid */
          <>
            <MasonryGrid>
              {posts.map((post, index) => (
                <MasonryBlogCard key={post._id} post={post} index={index} />
              ))}
            </MasonryGrid>

            {/* Load More */}
            {hasMore && (
              <div className="mt-10 text-center">
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

export default BlogCategoryPage;
