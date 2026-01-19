import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Eye } from 'lucide-react';
import type { BlogPost } from '../../types/marketplaceTypes';

interface BlogCardProps {
  post: BlogPost;
  onClick: () => void;
}

/**
 * BlogCard - Individual blog post card for the marketplace
 *
 * Displays:
 * - Featured image (aspect-video)
 * - Category badge
 * - Title (2 lines max)
 * - Timestamp (relative)
 * - Read time estimate
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
  const primaryCategory = post.categories[0];

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
      <div className="relative aspect-video overflow-hidden">
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
          {post.viewCount}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2
                      group-hover:text-emerald-600 transition-colors">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>
            {formatRelativeTime(post.publishedAt || post.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {post.readTimeMinutes} min read
          </span>
        </div>
      </div>
    </motion.article>
  );
};

export default BlogCard;
