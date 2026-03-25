import React, { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { blogPostsService } from '../../services/blog-portal.service';
import { useBlogAuth } from '../../context/BlogAuthContext';

interface LikeButtonProps {
  postId: string;
  initialCount?: number;
}

/**
 * LikeButton - Like/unlike button for blog posts
 *
 * Features:
 * - Shows current like count
 * - Toggles like state on click
 * - Requires authentication
 * - Optimistic UI updates
 */
export function LikeButton({ postId, initialCount = 0 }: LikeButtonProps) {
  const { isAuthenticated } = useBlogAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);

  // Fetch initial like status
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchLikeStatus = async () => {
      try {
        const status = await blogPostsService.getLikeStatus(postId);
        setIsLiked(status.isLiked);
        setLikeCount(status.likeCount);
        setStatusLoaded(true);
      } catch {
        setStatusLoaded(true);
      }
    };

    fetchLikeStatus();
  }, [postId, isAuthenticated]);

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = `/blog/login?redirect=/blog/post/${postId}`;
      return;
    }

    if (loading) return;

    // Optimistic update
    const prevLiked = isLiked;
    const prevCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    setLoading(true);
    try {
      const result = isLiked
        ? await blogPostsService.unlike(postId)
        : await blogPostsService.like(postId);

      setIsLiked(result.isLiked);
      setLikeCount(result.likeCount);
    } catch {
      // Revert on error
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      disabled={loading}
      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
        isLiked
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
      title={isAuthenticated ? (isLiked ? 'Unlike' : 'Like') : 'Login to like'}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      )}
      <span className="text-sm font-medium">{likeCount}</span>
    </button>
  );
}

export default LikeButton;
