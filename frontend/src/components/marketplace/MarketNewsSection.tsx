import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Sparkles, Loader2, RefreshCw, BookOpen, ArrowRight } from 'lucide-react';
import { blogService } from '../../services/blog.service';
import BlogCard from './BlogCard';
import BlogDetailModal from './BlogDetailModal';
import type { BlogPost, BlogPostsResponse } from '../../types/marketplaceTypes';

interface MarketNewsSectionProps {
  userName?: string;
}

/**
 * MarketNewsSection - Blog section with General and User's Interest tabs
 *
 * Features:
 * - Tab switching (General / User's Interest)
 * - Blog card grid
 * - Blog detail modal on click
 * - Loading states
 * - Empty states
 */
const MarketNewsSection: React.FC<MarketNewsSectionProps> = ({ userName }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'personalized'>('general');
  const [generalPosts, setGeneralPosts] = useState<BlogPost[]>([]);
  const [personalizedPosts, setPersonalizedPosts] = useState<BlogPost[]>([]);
  const [isActuallyPersonalized, setIsActuallyPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch posts
  const fetchPosts = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Fetch general posts
      const generalRes = await blogService.getPosts({ limit: 6 });
      setGeneralPosts(generalRes.posts);

      // Fetch personalized posts
      try {
        const personalizedRes = await blogService.getPersonalizedPosts({ limit: 6 });
        setPersonalizedPosts(personalizedRes.posts);
        // Check if backend actually personalized (user has products with matching categories/tags)
        setIsActuallyPersonalized(personalizedRes.isPersonalized ?? false);
      } catch (err) {
        // If personalization fails (e.g., no auth), use general posts
        setPersonalizedPosts(generalRes.posts);
        setIsActuallyPersonalized(false);
      }
    } catch (err) {
      console.error('Failed to fetch blog posts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCardClick = async (post: BlogPost) => {
    try {
      // Fetch full post content by slug
      const fullPost = await blogService.getPostBySlug(post.slug);
      setSelectedPost(fullPost);
      setModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch post:', err);
      // Use existing post data as fallback
      setSelectedPost(post);
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPost(null);
  };

  const currentPosts = activeTab === 'general' ? generalPosts : personalizedPosts;

  // Get user's first name for personalized tab
  const firstName = userName?.split(' ')[0] || 'Your';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Section Header with Tabs */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Newspaper className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Market News
              </h2>
              <p className="text-sm text-gray-500">
                Latest insights and trends
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Visit Breyus Blog link */}
            <a
              href="/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#B8860B] hover:text-[#9A7209] hover:bg-[#B8860B]/5 rounded-lg transition-colors group"
            >
              Visit Breyus Blog
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            {/* Refresh Button */}
            <button
              onClick={() => fetchPosts(true)}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100
                         rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'general'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('personalized')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'personalized'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {firstName}'s Interest
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
              <p className="text-gray-500 text-sm">Loading articles...</p>
            </motion.div>
          ) : currentPosts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {activeTab === 'personalized'
                  ? 'No personalized content yet'
                  : 'No articles available'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {activeTab === 'personalized'
                  ? 'Add products to your inventory to receive tailored market insights and recommendations.'
                  : 'Check back soon for the latest market news and insights.'}
              </p>
            </motion.div>
          ) : activeTab === 'personalized' && !isActuallyPersonalized ? (
            // Show personalized tab with notice that it's showing general content
            <motion.div
              key="personalized-fallback"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Info banner */}
              <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Tip:</span> Add products to your inventory to see personalized recommendations based on your business interests.
                </p>
              </div>
              {/* Show general posts as fallback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {currentPosts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <BlogCard post={post} onClick={() => handleCardClick(post)} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {currentPosts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <BlogCard post={post} onClick={() => handleCardClick(post)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Blog Detail Modal */}
      <BlogDetailModal
        post={selectedPost}
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default MarketNewsSection;
