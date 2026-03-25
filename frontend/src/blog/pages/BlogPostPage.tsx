import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Lock,
  MessageCircle,
  Loader2,
  Building2,
  User,
  Send,
} from 'lucide-react';
import { BlogLayout } from '../components/layout';
import {
  TiptapRenderer,
  ShareButtons,
  LikeButton,
  CommentsSection,
  ReadingProgressBar,
  TableOfContents,
} from '../components/post';
import { blogPostsService } from '../services/blog-portal.service';
import { useBlogAuth } from '../context/BlogAuthContext';
import type { BlogPostWithAccess, AccessReason } from '../types';

// Subscribe CTA state type
type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * BlogPostPage - Individual blog post detail/reader page
 *
 * Features:
 * - Full post content with Tiptap rendering
 * - Author info with Breyus member badge
 * - Like and share functionality
 * - Member-only content gating (Medium-style blur + overlay)
 * - Related posts (placeholder)
 */
export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useBlogAuth();

  const [post, setPost] = useState<BlogPostWithAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Newsletter subscribe state
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<SubscribeStatus>('idle');
  const [subscribeMessage, setSubscribeMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeEmail.trim()) return;
    setSubscribeStatus('loading');
    try {
      await blogPostsService.subscribeNewsletter(subscribeEmail.trim(), 'blog_post');
      setSubscribeStatus('success');
      setSubscribeMessage('Subscribed successfully!');
      setSubscribeEmail('');
      setTimeout(() => setSubscribeStatus('idle'), 4000);
    } catch (err: any) {
      setSubscribeStatus('error');
      setSubscribeMessage(err?.response?.data?.message || 'Failed to subscribe.');
      setTimeout(() => setSubscribeStatus('idle'), 4000);
    }
  };

  useEffect(() => {
    if (!slug) {
      navigate('/blog');
      return;
    }

    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedPost = await blogPostsService.getBySlug(slug);
        setPost(fetchedPost);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Post not found');
        } else {
          setError('Failed to load post');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, navigate]);

  // SEO Meta Tags
  useEffect(() => {
    if (!post) return;

    // Update document title
    const originalTitle = document.title;
    document.title = `${post.metaTitle || post.title} | Breyus Blog`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    const originalDescription = metaDescription?.getAttribute('content') || '';
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        post.metaDescription || post.excerpt || `Read ${post.title} on Breyus Blog`
      );
    }

    // Add/Update Open Graph tags
    const updateOrCreateMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateOrCreateMeta('og:title', post.metaTitle || post.title);
    updateOrCreateMeta(
      'og:description',
      post.metaDescription || post.excerpt || ''
    );
    updateOrCreateMeta('og:type', 'article');
    updateOrCreateMeta('og:url', window.location.href);
    if (post.featuredImage) {
      updateOrCreateMeta('og:image', post.featuredImage);
    }

    // Cleanup on unmount
    return () => {
      document.title = originalTitle;
      if (metaDescription) {
        metaDescription.setAttribute('content', originalDescription);
      }
    };
  }, [post]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Check if content is restricted
  const isRestricted = post && post.accessGranted === false;
  const accessReason: AccessReason = post?.accessReason || null;

  // Loading state
  if (loading) {
    return (
      <BlogLayout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-[#B8860B] animate-spin" />
          </div>
        </div>
      </BlogLayout>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <BlogLayout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link
            to="/blog"
            className="inline-flex items-center text-gray-500 hover:text-[#1A1A2E] mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Blog
          </Link>

          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">{error}</h2>
            <p className="text-gray-500">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center mt-4 text-[#B8860B] hover:text-[#9A7209] font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Return to homepage
            </Link>
          </div>
        </div>
      </BlogLayout>
    );
  }

  // Get category badge class
  const getCategoryBadgeClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('commodit')) return 'editorial-badge-commodities';
    if (cat.includes('trading') || cat.includes('trade')) return 'editorial-badge-trading';
    if (cat.includes('analysis') || cat.includes('market')) return 'editorial-badge-analysis';
    if (cat.includes('sustain')) return 'editorial-badge-sustainability';
    if (cat.includes('tech')) return 'editorial-badge-technology';
    return 'editorial-badge';
  };

  // Success - render post
  return (
    <BlogLayout>
      {/* Reading Progress Bar */}
      <ReadingProgressBar />

      <div className="max-w-7xl mx-auto px-4 py-8 lg:flex lg:gap-8">
        {/* Main Article */}
        <article className="flex-1 max-w-3xl">
          {/* Back Link */}
          <Link
            to="/blog"
            className="inline-flex items-center text-gray-500 hover:text-[#1A1A2E] mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Blog
          </Link>

        {/* Post Header */}
        <header className="mb-8">
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((category, idx) => (
                <Link
                  key={idx}
                  to={`/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                  className={getCategoryBadgeClass(category)}
                >
                  {category}
                </Link>
              ))}
              {post.accessLevel === 'member_only' && (
                <span className="px-3 py-1 bg-[#1A1A2E] text-white text-sm font-medium rounded-full flex items-center">
                  <Lock className="h-3 w-3 mr-1" />
                  Member Only
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] leading-tight">
            {post.title}
          </h1>

          {/* Meta Row */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
            {post.readTimeMinutes && (
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {post.readTimeMinutes} min read
              </span>
            )}
            {post.viewCount !== undefined && (
              <span className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {post.viewCount.toLocaleString()} views
              </span>
            )}
            {post.commentCount !== undefined && post.commentCount > 0 && (
              <span className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                {post.commentCount} comments
              </span>
            )}
          </div>

          {/* Author Info — Larger layout */}
          <div className="mt-8 flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
            {post.writerAvatar ? (
              <img
                src={post.writerAvatar}
                alt={post.writerDisplayName || 'Author'}
                className="h-16 w-16 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 font-semibold text-xl">
                  {(post.writerDisplayName || 'B').charAt(0)}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <Link
                to={post.writerId ? `/blog/author/${post.writerId}` : '#'}
                className="font-semibold text-lg text-[#1A1A2E] hover:text-[#B8860B] transition-colors"
              >
                {post.writerDisplayName || 'Breyus Team'}
              </Link>
              {post.writerBio && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.writerBio}</p>
              )}
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.featuredImage && (
          <figure className="mb-8 -mx-4 sm:mx-0">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full rounded-lg sm:rounded-xl object-cover max-h-[500px]"
            />
          </figure>
        )}

        {/* Post Content - With blur overlay if restricted */}
        <div className="relative">
          {/* Content container */}
          <div
            className={`prose-lg blog-content text-gray-700 leading-[1.8] text-lg ${isRestricted ? 'blur-content-restricted' : ''}`}
            style={isRestricted ? {
              filter: 'blur(8px)',
              userSelect: 'none',
              pointerEvents: 'none',
              maxHeight: '600px',
              overflow: 'hidden',
              maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
            } : undefined}
          >
            <TiptapRenderer content={post.tiptapContent} />
          </div>

          {/* Blur Overlay - Medium-style */}
          {isRestricted && (
            <div className="absolute inset-0 flex items-end justify-center pb-8">
              <div className="w-full max-w-lg mx-4">
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 md:p-8 text-center">
                  {/* Icon */}
                  <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    {accessReason === 'sign_in_required' ? (
                      <User className="h-8 w-8 text-gray-600" />
                    ) : (
                      <Building2 className="h-8 w-8 text-gray-600" />
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-[#1A1A2E] mb-2">
                    {accessReason === 'sign_in_required'
                      ? 'Sign in to continue reading'
                      : 'Member-Only Content'}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-500 mb-6">
                    {accessReason === 'sign_in_required'
                      ? 'This article is available to signed-in users. Create a free account or sign in to read the full article.'
                      : 'This article is exclusive to Breyus members. Join Breyus to unlock full access to all premium content and trading insights.'}
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    {accessReason === 'sign_in_required' ? (
                      <>
                        <Link
                          to="/blog/login"
                          state={{ from: { pathname: `/blog/post/${slug}` } }}
                          className="w-full sm:w-auto btn-editorial"
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/blog/signup"
                          className="w-full sm:w-auto btn-editorial-outline"
                        >
                          Create Free Account
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/onboarding"
                          className="w-full sm:w-auto btn-editorial"
                        >
                          Become a Member
                        </Link>
                        {!isAuthenticated && (
                          <Link
                            to="/blog/login"
                            state={{ from: { pathname: `/blog/post/${slug}` } }}
                            className="w-full sm:w-auto btn-editorial-outline"
                          >
                            Sign In
                          </Link>
                        )}
                      </>
                    )}
                  </div>

                  {/* Benefits hint */}
                  {accessReason === 'membership_required' && (
                    <p className="mt-4 text-sm text-gray-400">
                      Already a Breyus member?{' '}
                      <Link
                        to="/blog/login"
                        state={{ from: { pathname: `/blog/post/${slug}` } }}
                        className="text-[#B8860B] hover:text-[#9A7209] font-medium"
                      >
                        Sign in with your Breyus account
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Only show rest of content if access granted */}
        {!isRestricted && (
          <>
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-400">Tags:</span>
                  {post.tags.map((tag, idx) => (
                    <Link
                      key={idx}
                      to={`/blog/search?tag=${encodeURIComponent(tag)}`}
                      className="px-2 py-1 bg-gray-50 text-gray-600 text-sm rounded hover:bg-gray-100 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <LikeButton postId={post._id} initialCount={post.likeCount} />
              <ShareButtons postId={post._id} title={post.title} url={currentUrl} />
            </div>

            {/* CTA for non-members on public posts */}
            {(!isAuthenticated || (user && !user.isBrèyusMember)) &&
              post.accessLevel === 'public' && (
                <div className="mt-8 p-8 bg-[#1A1A2E] rounded-xl">
                  <h3 className="font-bold text-xl text-white">Enjoying this article?</h3>
                  <p className="text-gray-400 mt-2">
                    Join Breyus to access member-only content and exclusive trading insights.
                  </p>
                  <Link
                    to="/onboarding"
                    className="inline-flex items-center mt-4 px-5 py-2.5 bg-[#B8860B] hover:bg-[#9A7209] text-white font-medium rounded-lg transition-colors"
                  >
                    Join Breyus
                  </Link>
                </div>
              )}

            {/* Newsletter Subscribe CTA */}
            <div className="mt-8 p-6 md:p-8 editorial-card">
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#1A1A2E]">Stay Updated</h3>
                <p className="text-gray-500 mt-2">
                  Get the latest commodity trading insights delivered to your inbox.
                </p>
                <form onSubmit={handleSubscribe} className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <input
                    type="email"
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="input-editorial w-full sm:w-64 font-medium"
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
              </div>
            </div>

            {/* Comments Section */}
            <section className="mt-12 pt-8 border-t border-gray-200">
              <CommentsSection postId={post._id} />
            </section>
          </>
        )}
        </article>

        {/* Table of Contents Sidebar - Desktop only */}
        {!isRestricted && (
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <TableOfContents
                content={post.tiptapContent}
                className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm"
              />
            </div>
          </aside>
        )}
      </div>
    </BlogLayout>
  );
}

export default BlogPostPage;
