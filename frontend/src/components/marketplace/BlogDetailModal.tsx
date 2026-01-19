import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Eye, Calendar, Tag, Share2 } from 'lucide-react';
import type { BlogPost, BlockContent } from '../../types/marketplaceTypes';

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
 * - Rendered block content
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

  // Render block content
  const renderBlock = (block: BlockContent) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p key={block.id} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            {block.content}
          </p>
        );

      case 'heading1':
        return (
          <h2 key={block.id} className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            {block.content}
          </h2>
        );

      case 'heading2':
        return (
          <h3 key={block.id} className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
            {block.content}
          </h3>
        );

      case 'heading3':
        return (
          <h4 key={block.id} className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">
            {block.content}
          </h4>
        );

      case 'bulletList':
        return (
          <ul key={block.id} className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
            {block.meta?.items?.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );

      case 'numberedList':
        return (
          <ol key={block.id} className="list-decimal list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300">
            {block.meta?.items?.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        );

      case 'image':
        return block.content ? (
          <figure key={block.id} className="my-6">
            <img
              src={block.content}
              alt={block.meta?.alt || ''}
              className="w-full rounded-lg shadow-md"
            />
            {block.meta?.caption && (
              <figcaption className="mt-2 text-sm text-center text-gray-500">
                {block.meta.caption}
              </figcaption>
            )}
          </figure>
        ) : null;

      case 'quote':
        return (
          <blockquote
            key={block.id}
            className="border-l-4 border-emerald-500 pl-4 py-2 my-6 italic text-gray-600 dark:text-gray-400"
          >
            {block.content}
          </blockquote>
        );

      case 'code':
        return (
          <pre
            key={block.id}
            className="bg-gray-900 text-gray-100 rounded-lg p-4 my-4 overflow-x-auto text-sm"
          >
            <code className={block.meta?.language ? `language-${block.meta.language}` : ''}>
              {block.content}
            </code>
          </pre>
        );

      case 'divider':
        return <hr key={block.id} className="my-8 border-gray-200 dark:border-gray-700" />;

      default:
        return null;
    }
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
          className="relative w-full max-w-3xl my-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden"
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
                    className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700
                              dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(post.publishedAt || post.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readTimeMinutes} min read
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {post.viewCount} views
              </span>
            </div>

            {/* Divider */}
            <hr className="my-6 border-gray-200 dark:border-gray-700" />

            {/* Article Content */}
            <article className="prose prose-emerald dark:prose-invert max-w-none">
              {post.content.map(renderBlock)}
            </article>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-600
                                dark:bg-gray-800 dark:text-gray-400 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Share2 className="w-4 h-4" />
                  Share
                </span>
                <button
                  onClick={() => handleShare('twitter')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100
                            dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  Copy link
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BlogDetailModal;
