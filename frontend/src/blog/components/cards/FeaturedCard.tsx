import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Lock, Eye, Heart } from 'lucide-react';
import type { BlogPost } from '../../types';

interface FeaturedCardProps {
  post: BlogPost;
}

/**
 * FeaturedCard - Full-width immersive hero card
 *
 * Features:
 * - Full-width image with dark gradient overlay
 * - Title/excerpt/author overlaid in white text
 * - Gold CTA button
 * - Aspect ratio ~16:7 desktop
 * - Ken Burns effect on image
 */
export function FeaturedCard({ post }: FeaturedCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
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

  return (
    <Link
      to={`/blog/post/${post.slug}`}
      className="group block relative rounded-2xl overflow-hidden"
    >
      {/* Full-width immersive image */}
      <div className="relative aspect-[16/7] md:aspect-[16/7] sm:aspect-[16/9]">
        {post.featuredImage ? (
          <img
            src={post.featuredImage}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover blog-hero-image transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] to-[#2a2a4e] flex items-center justify-center">
            <span className="text-white/20 text-9xl font-bold">B</span>
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Category Badges - top left */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-wrap gap-2 z-10">
          {post.categories?.map((category, idx) => (
            <span key={idx} className={getCategoryBadgeClass(category)}>
              {category}
            </span>
          ))}
        </div>

        {/* Member-only Badge - top right */}
        {isMemberOnly && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white text-sm font-semibold rounded-full flex items-center space-x-1.5 z-10">
            <Lock className="h-4 w-4" />
            <span>Member Only</span>
          </div>
        )}

        {/* Content overlay - bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
          {/* Title */}
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-3xl">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="mt-3 text-white/80 text-base md:text-lg leading-relaxed line-clamp-2 max-w-2xl">
              {post.excerpt}
            </p>
          )}

          {/* Meta Row */}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            {/* Author */}
            <div className="flex items-center">
              {post.writerAvatar ? (
                <img
                  src={post.writerAvatar}
                  alt={post.writerDisplayName || 'Author'}
                  className="h-10 w-10 rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                  <span className="text-white font-medium">
                    {(post.writerDisplayName || 'B').charAt(0)}
                  </span>
                </div>
              )}
              <div className="ml-3">
                <p className="text-white font-medium">{post.writerDisplayName || 'Breyus Team'}</p>
                <div className="flex items-center space-x-3 text-white/60 text-sm">
                  <span className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    {formatDate(post.publishedAt || post.createdAt)}
                  </span>
                  {post.readTimeMinutes && (
                    <span className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {post.readTimeMinutes} min read
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Engagement Stats */}
            <div className="flex items-center space-x-3 ml-auto text-white/50 text-sm">
              {post.viewCount !== undefined && post.viewCount > 0 && (
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {post.viewCount.toLocaleString()}
                </span>
              )}
              {post.likeCount !== undefined && post.likeCount > 0 && (
                <span className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  {post.likeCount.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-6">
            <span className="inline-flex items-center px-5 py-2.5 bg-[#B8860B] text-white rounded-lg font-semibold transition-all duration-200 group-hover:bg-[#9A7209] group-hover:shadow-lg">
              Read Article
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default FeaturedCard;
