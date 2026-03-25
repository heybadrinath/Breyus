import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Send, Loader2 } from 'lucide-react';
import { BlogLayout } from '../components/layout';
import { HeroSection, TrendingSection, WriterSpotlight } from '../components/home';
import { MasonryBlogCard } from '../components/cards';
import { MasonryGrid } from '../components/layout/MasonryGrid';
import { MasonrySkeletonGrid } from '../components/shared/MasonryCardSkeleton';
import { blogPostsService } from '../services/blog-portal.service';
import { useBlogAuth } from '../context/BlogAuthContext';
import type { BlogPost } from '../types';

/**
 * BlogHomePage - Magazine-style editorial blog homepage with Pinterest masonry layout
 *
 * Layout:
 * - Hero: Full-width immersive featured post
 * - Post Grid: Pinterest-style masonry grid with scroll-reveal animations
 *   - Featured posts flow naturally with gold badges (no separate section)
 *   - Variable card heights based on aspect ratios
 * - Trending Section: Preview of trending posts + "View All →"
 * - WriterSpotlight: Featured writers
 * - CTA: Breyus member promotion
 * - Subscribe: Newsletter email signup
 */
export function BlogHomePage() {
  const { isAuthenticated, user } = useBlogAuth();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Newsletter subscribe state
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subscribeMessage, setSubscribeMessage] = useState('');

  // Fetch latest published posts (no category filter)
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const result = await blogPostsService.search({
          query: '',
          page: 1,
          limit: 12, // Fetch more for masonry layout
        });
        setPosts(result.posts || []);
        setHasMore((result.posts?.length || 0) >= 12);
      } catch (err) {
        console.error('Error fetching posts:', err);
        // Fallback to trending
        try {
          const trendingPosts = await blogPostsService.getTrending(12);
          setPosts(trendingPosts);
          setHasMore(false);
        } catch {
          setPosts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Load more handler
  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await blogPostsService.search({
        query: '',
        page: nextPage,
        limit: 12,
      });
      const newPosts = result.posts || [];
      setPosts((prev) => [...prev, ...newPosts]);
      setPage(nextPage);
      setHasMore(newPosts.length >= 12);
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Newsletter subscribe handler
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubscribeStatus('loading');
    try {
      await blogPostsService.subscribeNewsletter(email.trim(), 'blog_homepage');
      setSubscribeStatus('success');
      setSubscribeMessage('Subscribed successfully!');
      setEmail('');
      setTimeout(() => setSubscribeStatus('idle'), 4000);
    } catch (err: any) {
      setSubscribeStatus('error');
      setSubscribeMessage(err?.response?.data?.message || 'Failed to subscribe. Please try again.');
      setTimeout(() => setSubscribeStatus('idle'), 4000);
    }
  };

  return (
    <BlogLayout>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-8">
        {/* Hero Section - Immersive Featured Post */}
        <HeroSection />

        {/* Latest Posts - Pinterest-Style Masonry Grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">Latest Articles</h2>
          </div>

          {loading ? (
            <MasonrySkeletonGrid count={8} />
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No articles published yet.</p>
            </div>
          ) : (
            <>
              {/* Unified masonry grid - featured posts flow naturally with badges */}
              <MasonryGrid>
                {posts.map((post, index) => (
                  <MasonryBlogCard
                    key={post._id}
                    post={post}
                    index={index}
                  />
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
                    {loadingMore ? 'Loading...' : 'Load More Articles'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Trending Section Preview */}
        <TrendingSection limit={6} />

        {/* Writer Spotlight */}
        <WriterSpotlight />

        {/* Breyus CTA (only for non-members) */}
        {(!isAuthenticated || (user && !user.isBrèyusMember)) && (
          <section className="mb-12">
            <div className="relative overflow-hidden rounded-xl bg-[#1A1A2E] p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start space-x-4">
                  <div className="h-14 w-14 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-7 w-7 text-[#B8860B]" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white">
                      Unlock Member-Only Content
                    </h3>
                    <p className="text-gray-400 mt-2 max-w-xl text-lg">
                      Join Breyus to access exclusive articles, market analysis, and
                      industry insights from our expert traders.
                    </p>
                  </div>
                </div>
                <Link
                  to="/onboarding"
                  className="inline-flex items-center px-6 py-3 border border-gray-500 text-white rounded-lg hover:bg-white/10 hover:border-[#B8860B] font-semibold transition-colors group flex-shrink-0"
                >
                  Join Breyus
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Newsletter Subscribe */}
        <section className="mb-12">
          <div className="editorial-card p-8 md:p-10">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-[#1A1A2E]">Stay Updated</h3>
              <p className="text-gray-500 mt-3 text-lg">
                Get the latest commodity trading insights delivered to your inbox.
              </p>
              <form onSubmit={handleSubscribe} className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-editorial w-full sm:w-72 font-medium"
                  disabled={subscribeStatus === 'loading'}
                />
                <button
                  type="submit"
                  disabled={subscribeStatus === 'loading'}
                  className="btn-editorial-accent inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Subscribe
                </button>
              </form>
              {subscribeStatus !== 'idle' && (
                <p className={`mt-3 text-sm ${
                  subscribeStatus === 'success' ? 'text-green-600' :
                  subscribeStatus === 'error' ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {subscribeStatus === 'loading' ? 'Subscribing...' : subscribeMessage}
                </p>
              )}
              {subscribeStatus === 'idle' && (
                <p className="text-sm text-gray-400 mt-4">
                  No spam, unsubscribe anytime.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </BlogLayout>
  );
}

export default BlogHomePage;
