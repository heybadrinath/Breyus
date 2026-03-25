import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import type { BlogPost } from '../../types/marketplaceTypes';

interface BlogCardProps {
  post: BlogPost;
  onClick: () => void;
}

/**
 * BlogCard - Redesigned blog post card for the marketplace
 *
 * Displays:
 * - Featured image (16:9 aspect ratio)
 * - Category badge + view count overlay
 * - Title (2 lines max)
 * - Excerpt (2 lines)
 * - Writer avatar + name + read time
 * - Engagement counts (likes, comments, shares)
 */
const BlogCard: React.FC<BlogCardProps> = ({ post, onClick }) => {
  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get primary category for badge
  const primaryCategory = post.categories?.[0];

  // Default placeholder image
  const imageUrl = post.featuredImage || 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=200&fit=crop';

  return (
    <motion.article
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-xl overflow-hidden shadow-sm
                 hover:shadow-lg transition-all duration-300 cursor-pointer border
                 border-gray-200"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={imageUrl}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-300
                     group-hover:scale-105"
        />

        {/* Category Badge */}
        {primaryCategory && (
          <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-medium
                          bg-emerald-500 text-white rounded-full shadow-sm">
            {primaryCategory}
          </span>
        )}

        {/* View count overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1
                       bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
          <Eye className="w-3 h-3" />
          {(post.viewCount || 0).toLocaleString()}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2
                      group-hover:text-emerald-600 transition-colors leading-snug">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Writer Info + Time */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {post.writerAvatar ? (
              <img
                src={post.writerAvatar}
                alt={post.writerDisplayName || ''}
                className="h-7 w-7 rounded-full object-cover flex-shrink-0"
              />
            ) : post.writerDisplayName ? (
              <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-500 text-xs font-bold">
                  {post.writerDisplayName.charAt(0)}
                </span>
              </div>
            ) : null}
            <div className="min-w-0">
              {post.writerDisplayName && (
                <p className="text-sm font-medium text-gray-700 truncate">
                  {post.writerDisplayName}
                </p>
              )}
              <p className="text-xs text-gray-400">
                {formatRelativeTime(post.publishedAt || post.createdAt)}
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            <Clock className="w-3.5 h-3.5" />
            {post.readTimeMinutes ?? 1} min
          </span>
        </div>

        {/* Engagement Counts */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {post.likeCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {post.commentCount || 0}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5" />
            {post.shareCount || 0}
          </span>
        </div>
      </div>
    </motion.article>
  );
};

export default BlogCard;
