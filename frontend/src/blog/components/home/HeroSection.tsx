import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock, Eye, Heart, ArrowRight, Pause, Play } from 'lucide-react';
import { FeaturedPostSkeleton } from '../shared/BlogCardSkeleton';
import { blogPostsService } from '../../services/blog-portal.service';
import type { BlogPost } from '../../types';

/**
 * HeroSection - Interactive carousel for pinned posts
 *
 * Features:
 * - Auto-scroll through all pinned posts
 * - Manual navigation with arrows and dots
 * - Pause on hover
 * - Smooth transitions with fade effect
 * - Progress indicator
 * - Responsive design
 */
export function HeroSection() {
  const [pinnedPosts, setPinnedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const SLIDE_DURATION = 6000; // 6 seconds per slide
  const PROGRESS_INTERVAL = 50; // Update progress every 50ms

  useEffect(() => {
    const fetchPinned = async () => {
      try {
        const posts = await blogPostsService.getPinned(10);
        // If no pinned posts, fallback to featured post
        if (posts.length === 0) {
          const featured = await blogPostsService.getFeatured();
          if (featured) {
            setPinnedPosts([featured]);
          }
        } else {
          setPinnedPosts(posts);
        }
      } catch (err) {
        setError('Failed to load featured posts');
        console.error('Error fetching pinned posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPinned();
  }, []);

  // Auto-advance carousel
  const startAutoPlay = useCallback(() => {
    if (pinnedPosts.length <= 1) return;

    // Clear existing intervals
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    // Reset progress
    setProgress(0);

    // Start progress animation
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(newProgress);
    }, PROGRESS_INTERVAL);

    // Auto-advance slide
    intervalRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % pinnedPosts.length);
    }, SLIDE_DURATION);
  }, [pinnedPosts.length]);

  useEffect(() => {
    if (!isPaused && pinnedPosts.length > 1) {
      startAutoPlay();
    }
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [currentIndex, isPaused, startAutoPlay, pinnedPosts.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + pinnedPosts.length) % pinnedPosts.length);
    setProgress(0);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pinnedPosts.length);
    setProgress(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <section className="mb-12">
        <FeaturedPostSkeleton />
      </section>
    );
  }

  if (error || pinnedPosts.length === 0) {
    return null;
  }

  const currentPost = pinnedPosts[currentIndex];

  return (
    <section
      className="mb-12 relative group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Carousel Container */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1A1A2E]">
        {/* Background Image with Overlay */}
        <div className="relative aspect-[21/9] md:aspect-[21/8]">
          {pinnedPosts.map((post, index) => (
            <div
              key={post._id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentIndex
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105'
              }`}
            >
              {post.featuredImage ? (
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1A1A2E] via-[#2D2D4A] to-[#1A1A2E]" />
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E]/95 via-[#1A1A2E]/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E]/90 via-transparent to-[#1A1A2E]/30" />
            </div>
          ))}
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
            <div className="max-w-2xl">
              {/* Category Badge */}
              {currentPost.categories && currentPost.categories.length > 0 && (
                <span className="inline-block px-3 py-1 text-xs font-semibold text-[#B8860B] bg-[#B8860B]/20 rounded-full mb-4 backdrop-blur-sm">
                  {currentPost.categories[0]}
                </span>
              )}

              {/* Title */}
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 line-clamp-3">
                {currentPost.title}
              </h2>

              {/* Excerpt */}
              {currentPost.excerpt && (
                <p className="text-white/70 text-base md:text-lg leading-relaxed mb-6 line-clamp-2">
                  {currentPost.excerpt}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex items-center flex-wrap gap-4 text-white/60 text-sm mb-6">
                {currentPost.writerDisplayName && (
                  <span className="flex items-center">
                    {currentPost.writerAvatar ? (
                      <img
                        src={currentPost.writerAvatar}
                        alt={currentPost.writerDisplayName}
                        className="h-6 w-6 rounded-full object-cover mr-2"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center mr-2">
                        <span className="text-xs text-white">{currentPost.writerDisplayName.charAt(0)}</span>
                      </div>
                    )}
                    {currentPost.writerDisplayName}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(currentPost.publishedAt || currentPost.createdAt)}
                </span>
                {currentPost.readTimeMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {currentPost.readTimeMinutes} min read
                  </span>
                )}
                {currentPost.viewCount !== undefined && currentPost.viewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {currentPost.viewCount}
                  </span>
                )}
              </div>

              {/* CTA Button */}
              <Link
                to={`/blog/post/${currentPost.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#B8860B] hover:bg-[#D4A017] text-white font-semibold rounded-lg transition-all duration-300 group/btn"
              >
                Read Article
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Arrows (only show if multiple posts) */}
        {pinnedPosts.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Bottom Controls */}
        {pinnedPosts.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Dot Indicators with Progress */}
              <div className="flex items-center gap-2">
                {pinnedPosts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 ${
                      index === currentIndex ? 'w-8 bg-white/30' : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  >
                    {index === currentIndex && (
                      <div
                        className="absolute inset-0 bg-[#B8860B] rounded-full origin-left transition-transform"
                        style={{ transform: `scaleX(${progress / 100})` }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Slide Counter & Pause Button */}
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm font-medium">
                  {currentIndex + 1} / {pinnedPosts.length}
                </span>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all"
                  aria-label={isPaused ? 'Play slideshow' : 'Pause slideshow'}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Strip (for desktop, when more than 3 posts) */}
      {pinnedPosts.length > 2 && (
        <div className="hidden lg:flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
          {pinnedPosts.map((post, index) => (
            <button
              key={post._id}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-48 rounded-lg overflow-hidden transition-all duration-300 ${
                index === currentIndex
                  ? 'ring-2 ring-[#B8860B] ring-offset-2'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <div className="relative aspect-video">
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                )}
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white text-xs font-medium line-clamp-2">{post.title}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default HeroSection;
