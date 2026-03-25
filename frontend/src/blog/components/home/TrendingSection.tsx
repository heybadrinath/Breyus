import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { BlogCard } from '../cards';
import { BlogCardSkeleton } from '../shared/BlogCardSkeleton';
import { blogPostsService } from '../../services/blog-portal.service';
import type { BlogPost } from '../../types';

interface TrendingSectionProps {
  limit?: number;
}

/**
 * TrendingSection - Editorial trending posts section
 *
 * Features:
 * - Clean section header with dark navy + gold accent
 * - Card grid with stagger animation
 * - Refined hover effects
 */
export function TrendingSection({ limit = 6 }: TrendingSectionProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const trendingPosts = await blogPostsService.getTrending(limit);
        setPosts(trendingPosts);
      } catch (err) {
        console.error('Error fetching trending posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [limit]);

  if (loading) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-[#1A1A2E] flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">Trending Now</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-[#1A1A2E] flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">Trending Now</h2>
        </div>
        <Link
          to="/blog/trending"
          className="inline-flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 hover:border-gray-300 font-medium text-sm transition-colors group"
        >
          View All
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Posts Grid with stagger animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 blog-card-grid">
        {posts.map((post) => (
          <BlogCard key={post._id} post={post} />
        ))}
      </div>
    </section>
  );
}

export default TrendingSection;
