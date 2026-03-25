import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Eye, Heart, Clock, Star, Lock } from 'lucide-react';
import type { BlogPost } from '../../types';
import { useParallaxScroll } from '../../hooks/useScrollReveal';

/**
 * BlogCard - Blog post card with scroll animations
 *
 * Features:
 * - Parallax scroll effect (cards slide and slow at center)
 * - Unblur effect on scroll
 * - Scale animation on reveal
 * - Smooth hover effects
 */
interface BlogCardProps {
  post: BlogPost;
  /** Index in the list (for stagger animation) */
  index?: number;
  /** Disable animations */
  disableAnimation?: boolean;
}

/**
 * Format date to "Mon DD, YYYY" format
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format number with K/M suffix
 */
function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

export function MasonryBlogCard({
  post,
  index = 0,
  disableAnimation = false,
}: BlogCardProps) {
  const isMemberOnly = post.accessLevel === 'member_only';
  const isFeatured = post.isFeatured;

  // Use parallax scroll hook for smooth reveal + parallax effect
  const { ref, style, isInView } = useParallaxScroll(index, {
    intensity: 0.25,
    staggerDelay: 60,
    disabled: disableAnimation,
  });

  return (
    <Link
      ref={ref as React.RefObject<HTMLAnchorElement>}
      to={`/blog/post/${post.slug}`}
      className={`blog-card-wrapper block ${isInView ? 'in-view' : ''}`}
      style={style}
    >
      <article className="blog-card group">
        {/* Image Container */}
        <div className="blog-card-image-wrapper">
          {post.featuredImage ? (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="blog-card-image"
              loading="lazy"
            />
          ) : (
            <div className="blog-card-image blog-card-placeholder">
              <span className="text-white/20 text-7xl font-bold">B</span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="blog-card-gradient" />

          {/* Featured Badge */}
          {isFeatured && (
            <div className="blog-card-badge blog-card-badge-featured">
              <Star className="h-3 w-3 fill-current" />
              <span>Featured</span>
            </div>
          )}

          {/* Member-only Lock Badge */}
          {isMemberOnly && !isFeatured && (
            <div className="blog-card-badge blog-card-badge-member">
              <Lock className="h-3 w-3" />
              <span>Member</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="blog-card-content">
          {/* Category Badge */}
          {post.categories && post.categories.length > 0 && (
            <span className="blog-card-category">
              {post.categories[0]}
            </span>
          )}

          {/* Title */}
          <h3 className="blog-card-title">{post.title}</h3>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="blog-card-excerpt">{post.excerpt}</p>
          )}

          {/* Author Row */}
          {post.writerDisplayName && (
            <div className="blog-card-author">
              {post.writerAvatar ? (
                <img
                  src={post.writerAvatar}
                  alt={post.writerDisplayName}
                  className="blog-card-avatar"
                  loading="lazy"
                />
              ) : (
                <div className="blog-card-avatar-fallback">
                  {post.writerDisplayName.charAt(0)}
                </div>
              )}
              <span className="blog-card-author-name">
                {post.writerDisplayName}
              </span>
            </div>
          )}

          {/* Meta Row */}
          <div className="blog-card-meta">
            <span className="blog-card-meta-item">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
            {post.readTimeMinutes && (
              <span className="blog-card-meta-item">
                <Clock className="h-3.5 w-3.5" />
                {post.readTimeMinutes} min
              </span>
            )}
            {post.viewCount !== undefined && post.viewCount > 0 && (
              <span className="blog-card-meta-item">
                <Eye className="h-3.5 w-3.5" />
                {formatCount(post.viewCount)}
              </span>
            )}
            {post.likeCount !== undefined && post.likeCount > 0 && (
              <span className="blog-card-meta-item">
                <Heart className="h-3.5 w-3.5" />
                {formatCount(post.likeCount)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

// Export with original name for backwards compatibility
export default MasonryBlogCard;
