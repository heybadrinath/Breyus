import { useState } from 'react';
import { useBlogAuth } from '../../context/BlogAuthContext';
import { blogCommentsService } from '../../services/blog-portal.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BlogComment } from '../../types';

interface CommentsSectionProps {
  postId: string;
}

/**
 * CommentsSection - Comment thread for blog posts
 *
 * Features:
 * - Display comments with nested replies
 * - Add new comments (requires auth)
 * - Flag inappropriate comments
 * - Delete own comments
 * - Show Breyus member badge
 */
export function CommentsSection({ postId }: CommentsSectionProps) {
  const { user, isAuthenticated } = useBlogAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [flaggingComment, setFlaggingComment] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');

  // Fetch comments
  const { data, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => blogCommentsService.getComments(postId),
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (payload: { content: string; parentId?: string }) =>
      blogCommentsService.addComment(postId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      setNewComment('');
      setReplyContent('');
      setReplyingTo(null);
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => blogCommentsService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  // Flag comment mutation
  const flagCommentMutation = useMutation({
    mutationFn: ({ commentId, reason }: { commentId: string; reason: string }) =>
      blogCommentsService.flagComment(commentId, reason),
    onSuccess: () => {
      setFlaggingComment(null);
      setFlagReason('');
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate({ content: newComment });
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    addCommentMutation.mutate({ content: replyContent, parentId });
  };

  const handleFlag = (commentId: string) => {
    if (!flagReason.trim()) return;
    flagCommentMutation.mutate({ commentId, reason: flagReason });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Comments are already organized by backend - root comments have nested replies array
  const topLevelComments = data?.comments || [];
  // Get replies from the nested structure (backend attaches replies to each comment)
  const getReplies = (comment: BlogComment) =>
    (comment as any).replies || [];

  const renderComment = (comment: BlogComment, isReply = false) => (
    <div
      key={comment._id}
      className={`${isReply ? 'ml-8 md:ml-12 border-l-2 border-gray-100 pl-4' : ''}`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#B8860B]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-[#B8860B]">
            {getInitials(`${comment.user.firstName} ${comment.user.lastName}`)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">
              {`${comment.user.firstName} ${comment.user.lastName}`}
            </span>
            {comment.user.isBrèyusMember && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Breyus Member
              </span>
            )}
            <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
          </div>

          <p className="mt-1 text-gray-700">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            {isAuthenticated && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                className="text-sm text-gray-500 hover:text-[#B8860B] transition-colors"
              >
                Reply
              </button>
            )}
            {user && user._id === comment.user._id && (
              <button
                onClick={() => {
                  if (window.confirm('Delete this comment?')) {
                    deleteCommentMutation.mutate(comment._id);
                  }
                }}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                Delete
              </button>
            )}
            {isAuthenticated && user?._id !== comment.user._id && (
              <button
                onClick={() => setFlaggingComment(comment._id)}
                className="text-sm text-gray-500 hover:text-orange-500 transition-colors"
              >
                Report
              </button>
            )}
          </div>

          {/* Reply form */}
          {replyingTo === comment._id && (
            <div className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8860B] resize-none text-sm"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setReplyingTo(null)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitReply(comment._id)}
                  disabled={!replyContent.trim() || addCommentMutation.isPending}
                  className="px-3 py-1.5 text-sm bg-[#B8860B] text-white rounded-lg hover:bg-[#9A7209] disabled:opacity-50 transition-colors"
                >
                  Reply
                </button>
              </div>
            </div>
          )}

          {/* Flag modal */}
          {flaggingComment === comment._id && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 mb-2">Why are you reporting this comment?</p>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">Select a reason</option>
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="misinformation">Misinformation</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="other">Other</option>
              </select>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setFlaggingComment(null);
                    setFlagReason('');
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleFlag(comment._id)}
                  disabled={!flagReason || flagCommentMutation.isPending}
                  className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {getReplies(comment).length > 0 && (
        <div className="mt-4 space-y-4">
          {getReplies(comment).map((reply: BlogComment) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-500">
        Failed to load comments. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900">
        Comments ({data?.total || 0})
      </h3>

      {/* Add comment form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B8860B] resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className="px-6 py-2 bg-[#B8860B] text-white rounded-lg font-medium hover:bg-[#9A7209] disabled:opacity-50 transition-colors"
            >
              {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-gray-600 mb-2">Sign in to join the conversation</p>
          <a
            href="/blog/login"
            className="text-[#B8860B] font-medium hover:underline"
          >
            Log in or Sign up
          </a>
        </div>
      )}

      {/* Comments list */}
      {topLevelComments.length === 0 ? (
        <div className="py-12 text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {topLevelComments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
}

export default CommentsSection;
