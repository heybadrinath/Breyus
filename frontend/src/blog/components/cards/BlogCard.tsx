import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Eye, Heart, MessageCircle, Lock, Clock, Star } from 'lucide-react';
import type { BlogPost } from '../../types';

interface BlogCardProps {
  post: BlogPost;
  compact?: boolean;
  variant?: 'default' | 'large' | 'compact' | 'featured';
}

/**
 * BlogCard - Editorial blog post card with variants
 *
 * Variants:
 * - default: Standard vertical card (1x1 in grid)
 * - featured: Large square card spanning 2 cols × 2 rows (2x2 in grid)
 * - large: Horizontal layout with image left, content right (2-col span, 1 row)
 * - compact: Minimal card with smaller text
 *
 * Features:
 * - Clean white background with subtle shadow
 * - Subtle image zoom on hover
 * - Solid category badge (no glass effect)
 * - Member-only lock indicator
 * - Refined lift animation on hover
 */
export function BlogCard({ post, compact = false, variant = 'default' }: BlogCardProps) {
  // Support legacy `compact` prop
  const effectiveVariant = compact ? 'compact' : variant;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isMemberOnly = post.accessLevel === 'member_only';

  const getCategoryBadgeClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('commodit')) return 'editorial-badge-commodities';
    if (cat.includes('trading') || cat.includes('trade')) return 'editorial-badge-trading';
    if (cat.includes('analysis') || cat.includes('market')) return 'editorial-badge-analysis';
    if (cat.includes('sustain')) return 'editorial-badge-sustainability';
    if (cat.includes('tech')) return 'editorial-badge-technology';
    return 'editorial-badge';
  };

  const isFeatured = effectiveVariant === 'featured';
  const isLarge = effectiveVariant === 'large';
  const isCompact = effectiveVariant === 'compact';

  // Determine if this is a featured post being displayed large
  const isFeaturedLarge = post.isFeatured && isLarge;

  // Featured variant: 2x2 large square card (spans 2 columns and 2 rows)
  // On mobile: displays as a single column card (same as regular)
  if (isFeatured) {
    return (
      <Link
        to={`/blog/post/${post.slug}`}
        className="group block editorial-card overflow-hidden md:col-span-2 md:row-span-2 ring-2 ring-[#B8860B]/20 shadow-lg shadow-[#B8860B]/5 hover:ring-[#B8860B]/40 hover:shadow-xl transition-all duration-300"
      >
        {/* Image - taller on desktop for 2x2 effect */}
        <div className="relative overflow-hidden bg-gray-100 aspect-[16/10] md:aspect-[4/3]">
          {post.featuredImage ? (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4A]">
              <span className="text-white/30 text-8xl font-bold">B</span>
            </div>
          )}

          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Category Badge */}
          {post.categories && post.categories.length > 0 && (
            <span className={`absolute top-4 left-4 ${getCategoryBadgeClass(post.categories[0])} z-10`}>
              {post.categories[0]}
            </span>
          )}

          {/* Featured Badge */}
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-[#B8860B] to-[#D4A017] text-white text-xs font-semibold rounded-full flex items-center space-x-1.5 z-10 shadow-lg">
            <Star className="h-3.5 w-3.5 fill-white" />
            <span>Featured</span>
          </div>

          {/* Content overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
            {/* Title */}
            <h3 className="font-bold text-white text-xl md:text-2xl line-clamp-2 mb-2 drop-shadow-lg">
              {post.title}
            </h3>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-white/80 text-sm md:text-base leading-relaxed line-clamp-2 mb-3">
                {post.excerpt}
              </p>
            )}

            {/* Meta Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-white/70">
                <span className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {formatDate(post.publishedAt || post.createdAt)}
                </span>
                {post.readTimeMinutes && (
                  <span className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {post.readTimeMinutes} min
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                {post.viewCount !== undefined && post.viewCount > 0 && (
                  <span className="flex items-center">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    {post.viewCount}
                  </span>
                )}
                {post.likeCount !== undefined && post.likeCount > 0 && (
                  <span className="flex items-center">
                    <Heart className="h-3.5 w-3.5 mr-1" />
                    {post.likeCount}
                  </span>
                )}
              </div>
            </div>

            {/* Author */}
            {post.writerDisplayName && (
              <div className="mt-3 pt-3 border-t border-white/20 flex items-center">
                {post.writerAvatar ? (
                  <img
                    src={post.writerAvatar}
                    alt={post.writerDisplayName}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-white/30"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {post.writerDisplayName.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="ml-2 text-sm font-medium text-white">{post.writerDisplayName}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Large variant uses horizontal layout to match height with regular cards
  if (isLarge) {
    return (
      <Link
        to={`/blog/post/${post.slug}`}
        className={`group block editorial-card overflow-hidden self-start md:col-span-2 ${
          isFeaturedLarge ? 'ring-2 ring-[#B8860B]/30 shadow-lg shadow-[#B8860B]/10' : ''
        }`}
      >
        {/* Horizontal layout: Image left, Content right */}
        <div className="flex flex-col md:flex-row">
          {/* Image Section - 55% width on desktop */}
          <div className="relative overflow-hidden bg-gray-100 md:w-[55%] aspect-[16/10] md:aspect-auto">
            {post.featuredImage ? (
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-103"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <span className="text-gray-300 text-6xl font-bold">B</span>
              </div>
            )}

            {/* Category Badge */}
            {post.categories && post.categories.length > 0 && (
              <span className={`absolute top-3 left-3 ${getCategoryBadgeClass(post.categories[0])} z-10`}>
                {post.categories[0]}
              </span>
            )}

            {/* Featured Badge */}
            {post.isFeatured && (
              <div className="absolute top-3 right-3 px-2.5 py-1.5 bg-gradient-to-r from-[#B8860B] to-[#D4A017] text-white text-xs font-semibold rounded-full flex items-center space-x-1 z-10 shadow-lg">
                <Star className="h-3 w-3 fill-white" />
                <span>Featured</span>
              </div>
            )}

            {/* Member-only Lock */}
            {isMemberOnly && !post.isFeatured && (
              <div className="absolute top-3 right-3 px-2.5 py-1.5 bg-[#1A1A2E] text-white text-xs font-semibold rounded-full flex items-center space-x-1 z-10">
                <Lock className="h-3 w-3" />
                <span>Member</span>
              </div>
            )}
          </div>

          {/* Content Section - 45% width on desktop */}
          <div className="md:w-[45%] p-5 md:p-6 flex flex-col justify-center">
            {/* Title */}
            <h3 className="font-semibold text-[#1A1A2E] group-hover:text-[#B8860B] transition-colors duration-200 text-lg md:text-xl line-clamp-2">
              {post.title}
            </h3>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="mt-2 text-gray-500 text-sm leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="mt-4 flex items-center flex-wrap gap-3 text-xs text-gray-400">
              <span className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {formatDate(post.publishedAt || post.createdAt)}
              </span>
              {post.readTimeMinutes && (
                <span className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {post.readTimeMinutes} min
                </span>
              )}
              {post.viewCount !== undefined && post.viewCount > 0 && (
                <span className="flex items-center">
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  {post.viewCount}
                </span>
              )}
              {post.likeCount !== undefined && post.likeCount > 0 && (
                <span className="flex items-center">
                  <Heart className="h-3.5 w-3.5 mr-1" />
                  {post.likeCount}
                </span>
              )}
            </div>

            {/* Author */}
            {post.writerDisplayName && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center">
                {post.writerAvatar ? (
                  <img
                    src={post.writerAvatar}
                    alt={post.writerDisplayName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-500 text-xs font-bold">
                      {post.writerDisplayName.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="ml-2">
                  <span className="text-sm font-medium text-gray-700">{post.writerDisplayName}</span>
                  {isMemberOnly && (
                    <span className="ml-2 inline-flex items-center text-xs text-gray-400">
                      <Lock className="h-3 w-3 mr-0.5" />
                      Member
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Default and Compact variants - vertical layout
  return (
    <Link
      to={`/blog/post/${post.slug}`}
      className="group block editorial-card overflow-hidden self-start"
    >
      {/* Featured Image Container */}
      <div className={`editorial-card-image relative overflow-hidden bg-gray-100 ${
        isCompact ? 'aspect-[16/10]' : 'aspect-[16/10]'
      }`}>
        {post.featuredImage ? (
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-103"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-gray-300 text-6xl font-bold">B</span>
          </div>
        )}

        {/* Category Badge */}
        {post.categories && post.categories.length > 0 && (
          <span className={`absolute top-3 left-3 ${getCategoryBadgeClass(post.categories[0])} z-10`}>
            {post.categories[0]}
          </span>
        )}

        {/* Member-only Lock */}
        {isMemberOnly && (
          <div className="absolute top-3 right-3 px-2.5 py-1.5 bg-[#1A1A2E] text-white text-xs font-semibold rounded-full flex items-center space-x-1 z-10">
            <Lock className="h-3 w-3" />
            <span>Member</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`${isCompact ? 'p-4' : 'p-5'}`}>
        {/* Title */}
        <h3
          className={`font-semibold text-[#1A1A2E] group-hover:text-[#B8860B] transition-colors duration-200 line-clamp-2 ${
            isCompact ? 'text-base' : 'text-lg'
          }`}
        >
          {post.title}
        </h3>

        {/* Excerpt */}
        {!isCompact && post.excerpt && (
          <p className="mt-2 text-gray-500 text-sm leading-relaxed line-clamp-2">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-3">
            {/* Date */}
            <span className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
            {/* Read Time */}
            {post.readTimeMinutes && (
              <span className="flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1" />
                {post.readTimeMinutes} min
              </span>
            )}
          </div>

          {/* Engagement */}
          <div className="flex items-center space-x-2">
            {post.viewCount !== undefined && post.viewCount > 0 && (
              <span className="flex items-center">
                <Eye className="h-3.5 w-3.5 mr-1" />
                {post.viewCount}
              </span>
            )}
            {post.likeCount !== undefined && post.likeCount > 0 && (
              <span className="flex items-center">
                <Heart className="h-3.5 w-3.5 mr-1" />
                {post.likeCount}
              </span>
            )}
            {post.commentCount !== undefined && post.commentCount > 0 && (
              <span className="flex items-center">
                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                {post.commentCount}
              </span>
            )}
          </div>
        </div>

        {/* Author */}
        {post.writerDisplayName && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center">
            {post.writerAvatar ? (
              <img
                src={post.writerAvatar}
                alt={post.writerDisplayName}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-500 text-xs font-bold">
                  {post.writerDisplayName.charAt(0)}
                </span>
              </div>
            )}
            <span className="ml-2 text-sm font-medium text-gray-600">{post.writerDisplayName}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default BlogCard;
