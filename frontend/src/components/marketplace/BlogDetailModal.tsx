import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Eye, Calendar, Tag, Share2, PenTool, ArrowRight } from 'lucide-react';
import type { BlogPost } from '../../types/marketplaceTypes';
import { TiptapRenderer } from '../../blog/components/post/TiptapRenderer';

interface BlogDetailModalProps {
  post: BlogPost | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * BlogDetailModal - Full article view modal
 *
 * Displays:
 * - Featured image header
 * - Title, author, publish date
 * - Tiptap-rendered content
 * - Tags
 * - Share buttons
 */
const BlogDetailModal: React.FC<BlogDetailModalProps> = ({ post, isOpen, onClose }) => {
  if (!isOpen || !post) return null;

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Share handlers
  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.title);

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-3xl my-8 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full
                       text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative aspect-[2/1] overflow-hidden">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Categories */}
            {post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1 text-xs font-medium bg-[#B8860B]/10 text-[#8B6914]
                              rounded-full border border-[#B8860B]/20"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(post.publishedAt || post.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readTimeMinutes ?? 1} min read
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {(post.viewCount ?? 0).toLocaleString()} views
              </span>
            </div>

            {/* Divider */}
            <hr className="my-6 border-gray-200" />

            {/* Article Content */}
            <article className="prose prose-amber max-w-none">
              <TiptapRenderer content={post.tiptapContent} />
            </article>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-[#B8860B]" />
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-600
                                hover:bg-[#B8860B]/10 hover:text-[#8B6914] rounded-full
                                transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                  <Share2 className="w-4 h-4" />
                  Share
                </span>
                <button
                  onClick={() => handleShare('twitter')}
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="p-2 text-gray-500 hover:text-[#0077B5] hover:bg-blue-50 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-[#B8860B] hover:bg-[#B8860B]/10
                            rounded-full transition-colors font-medium"
                >
                  Copy link
                </button>
              </div>
            </div>

            {/* CTA Banner — Visit Breyus Blog */}
            <div className="mt-8 p-5 rounded-xl bg-gradient-to-r from-[#B8860B]/10 to-amber-50 border border-[#B8860B]/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#B8860B]/20 rounded-lg">
                    <PenTool className="w-4 h-4 text-[#B8860B]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Like this article? Read it on Breyus Blog
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Comment, like & join the conversation
                    </p>
                  </div>
                </div>
                <a
                  href={`/blog/post/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B8860B] text-white text-sm font-medium rounded-lg hover:bg-[#9A7209] transition-colors flex-shrink-0 shadow-sm hover:shadow-md"
                >
                  Open on Breyus Blog
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BlogDetailModal;
