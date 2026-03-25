import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBlogAuth } from '../context/BlogAuthContext';
import { blogPortalService } from '../services/blog-portal.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BlogLayout } from '../components/layout/BlogLayout';
import {
  Loader2, Lock, TrendingUp, TrendingDown, Minus, Eye, Heart,
  BarChart3, MessageCircle, ArrowUpDown, RefreshCw, ChevronUp, ChevronDown,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { BlogPostListItem, BlogStatus } from '../types';

const STATUS_LABELS: Record<BlogStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In Review',
  revision_requested: 'Revision Requested',
  approved: 'Approved',
  published: 'Published',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<BlogStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  in_review: 'bg-purple-100 text-purple-700',
  revision_requested: 'bg-orange-100 text-orange-700',
  approved: 'bg-teal-100 text-teal-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

type SortField = 'views' | 'likes' | 'comments' | 'publishedAt';
type SortDirection = 'asc' | 'desc';

/**
 * WriterDashboard - Enhanced dashboard for blog writers
 *
 * Features:
 * - Content Stats (total, published, drafts, in review)
 * - Performance Stats (views, likes, engagement — published only)
 * - Views & Likes trend chart with estimate note
 * - Post Performance sortable table
 * - Recent Comments section
 * - Post list with status filter
 */
export function WriterDashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useBlogAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<BlogStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('views');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Fetch writer's posts
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['writer', 'posts'],
    queryFn: () => blogPortalService.getWriterPosts(),
  });

  // Fetch analytics with trends
  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['writer', 'analytics'],
    queryFn: () => blogPortalService.getWriterAnalytics(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (postId: string) => blogPortalService.deleteWriterPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writer', 'posts'] });
    },
  });

  // Submit for review mutation
  const submitMutation = useMutation({
    mutationFn: (postId: string) => blogPortalService.submitPostForReview(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['writer', 'posts'] });
    },
  });

  // Filter posts by status
  const filteredPosts = posts?.filter((post: BlogPostListItem) =>
    statusFilter === 'all' ? true : post.status === statusFilter
  ) || [];

  // Content stats (from all posts)
  const contentStats = {
    total: posts?.length || 0,
    published: posts?.filter((p: BlogPostListItem) => p.status === 'published').length || 0,
    drafts: posts?.filter((p: BlogPostListItem) => p.status === 'draft').length || 0,
    inReview: posts?.filter((p: BlogPostListItem) =>
      ['submitted', 'in_review'].includes(p.status)
    ).length || 0,
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    try {
      await deleteMutation.mutateAsync(postId);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleSubmit = async (postId: string) => {
    if (!window.confirm('Submit this post for review? You can still make edits until it\'s approved.')) return;
    try {
      await submitMutation.mutateAsync(postId);
    } catch (err) {
      console.error('Failed to submit:', err);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['writer', 'posts'] });
    refetchAnalytics();
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 text-[#B8860B]" />
      : <ChevronUp className="w-3 h-3 text-[#B8860B]" />;
  };

  // Sort post performance data
  const sortedPerformance = [...(analytics?.postPerformance || [])].sort((a: any, b: any) => {
    const multiplier = sortDir === 'desc' ? -1 : 1;
    if (sortField === 'publishedAt') {
      return multiplier * (new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    }
    return multiplier * ((a[sortField] || 0) - (b[sortField] || 0));
  });

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <BlogLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#B8860B] animate-spin" />
        </div>
      </BlogLayout>
    );
  }

  // Writer access check
  if (!user?.isWriter) {
    return (
      <BlogLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Writer Access Required</h1>
          <p className="text-gray-500 mb-6">
            You need to be an approved writer to access this page.
          </p>
          <Link to="/blog" className="btn-editorial inline-block">
            Back to Blog
          </Link>
        </div>
      </BlogLayout>
    );
  }

  return (
    <BlogLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Writer Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user.firstName}! Manage your blog posts here.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => navigate('/blog/writer/new')}
              className="px-6 py-2.5 bg-[#B8860B] text-white rounded-lg font-medium hover:bg-[#9A7209] transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Post
            </button>
          </div>
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{contentStats.total}</div>
            <div className="text-sm text-gray-500">Total Posts</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-2xl font-bold text-green-600">{contentStats.published}</div>
            <div className="text-sm text-gray-500">Published</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-2xl font-bold text-yellow-600">{contentStats.drafts}</div>
            <div className="text-sm text-gray-500">Drafts</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">{contentStats.inReview}</div>
            <div className="text-sm text-gray-500">In Review</div>
          </div>
        </div>

        {/* Performance Stats (published only) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-blue-600">
                {(analytics?.totalViews || 0).toLocaleString()}
              </div>
              {analytics?.growthRate !== undefined && analytics?.growthRate !== null ? (
                <span className={`flex items-center text-xs font-medium ${
                  analytics.growthRate > 0 ? 'text-green-600' : analytics.growthRate < 0 ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {analytics.growthRate > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> :
                   analytics.growthRate < 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> :
                   <Minus className="w-3 h-3 mr-0.5" />}
                  {Math.abs(analytics.growthRate)}%
                </span>
              ) : analytics?.growthRate === null ? (
                <span className="text-xs font-medium text-[#B8860B] bg-[#B8860B]/10 px-2 py-0.5 rounded-full">
                  New
                </span>
              ) : null}
            </div>
            <div className="text-sm text-gray-500">Total Views <span className="text-xs text-gray-400">(published)</span></div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-2xl font-bold text-red-500">{analytics?.totalLikes || 0}</div>
            <div className="text-sm text-gray-500">Total Likes <span className="text-xs text-gray-400">(published)</span></div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-[#B8860B]">
                {analytics?.engagementRate || 0}%
              </div>
            </div>
            <div className="text-sm text-gray-500">Engagement Rate</div>
          </div>
        </div>

        {/* Performance Charts */}
        {analytics && (analytics.viewsTrend?.length > 0 || analytics.likesTrend?.length > 0) && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#B8860B]" />
                Views & Likes Trend
              </h3>
              <span className="text-xs text-gray-400">Last 30 days</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analytics.viewsTrend?.map((v: any, i: number) => ({
                    date: new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    views: v.count,
                    likes: analytics.likesTrend?.[i]?.count || 0,
                  })) || []}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e5e5' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e5e5' }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
                  <Line type="monotone" dataKey="views" name="Views" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="likes" name="Likes" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Based on post performance estimates
            </p>
          </div>
        )}

        {/* Post Performance Table */}
        {analytics?.postPerformance && analytics.postPerformance.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 mb-8 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#B8860B]" />
                Post Performance
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => toggleSort('publishedAt')}
                    >
                      <span className="flex items-center gap-1">
                        Published <SortIcon field="publishedAt" />
                      </span>
                    </th>
                    <th
                      className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => toggleSort('views')}
                    >
                      <span className="flex items-center justify-end gap-1">
                        Views <SortIcon field="views" />
                      </span>
                    </th>
                    <th
                      className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => toggleSort('likes')}
                    >
                      <span className="flex items-center justify-end gap-1">
                        Likes <SortIcon field="likes" />
                      </span>
                    </th>
                    <th
                      className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => toggleSort('comments')}
                    >
                      <span className="flex items-center justify-end gap-1">
                        Comments <SortIcon field="comments" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedPerformance.map((post: any) => (
                    <tr
                      key={post.slug}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/blog/post/${post.slug}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {post.title}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {post.publishedAt ? formatDate(post.publishedAt) : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium whitespace-nowrap">
                        {(post.views || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right whitespace-nowrap">
                        {post.likes || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right whitespace-nowrap">
                        {post.comments || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Comments */}
        {analytics?.recentComments && analytics.recentComments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 mb-8">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#B8860B]" />
                Recent Comments
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {analytics.recentComments.map((comment: any) => (
                <div key={comment._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Commenter avatar */}
                    {comment.commenterAvatar ? (
                      <img
                        src={comment.commenterAvatar}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-500 text-xs font-bold">
                          {comment.commenterName?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-900">{comment.commenterName}</span>
                        <span className="text-gray-400">on</span>
                        <Link
                          to={`/blog/post/${comment.postSlug}`}
                          className="text-[#B8860B] hover:underline truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          "{comment.postTitle}"
                        </Link>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {comment.content}
                      </p>
                      <span className="text-xs text-gray-400 mt-1 block">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No comments placeholder */}
        {analytics && (!analytics.recentComments || analytics.recentComments.length === 0) && contentStats.published > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 mb-8 p-8 text-center">
            <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">No comments yet</h3>
            <p className="text-gray-500 text-sm mt-1">Keep writing — comments will show up here!</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Your Posts</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'draft', 'submitted', 'in_review', 'revision_requested', 'approved', 'published', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as BlogStatus | 'all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-[#B8860B] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : STATUS_LABELS[status as BlogStatus]}
            </button>
          ))}
        </div>

        {/* Posts List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-16">
            Failed to load posts. Please try again.
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">No posts yet</h3>
            <p className="text-gray-500 mt-1 mb-4">Start writing your first blog post!</p>
            <button
              onClick={() => navigate('/blog/writer/new')}
              className="px-6 py-2 bg-[#B8860B] text-white rounded-lg font-medium hover:bg-[#9A7209] transition-colors"
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post: BlogPostListItem) => (
              <div
                key={post._id}
                className="bg-white rounded-xl border border-gray-100 p-6 hover:border-gray-200 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Thumbnail */}
                  {post.featuredImage && (
                    <img
                      src={post.featuredImage}
                      alt=""
                      className="w-full md:w-32 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {post.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2 mt-1">
                          {post.excerpt}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[post.status]}`}>
                        {STATUS_LABELS[post.status]}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                      <span>{formatDate(post.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.viewCount} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.commentCount}
                      </span>
                    </div>

                    {/* Rejection/Revision notes */}
                    {post.status === 'rejected' && post.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-sm text-red-700">
                          <strong>Rejection reason:</strong> {post.rejectionReason}
                        </p>
                      </div>
                    )}
                    {post.status === 'revision_requested' && post.revisionNotes && (
                      <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <p className="text-sm text-orange-700">
                          <strong>Revision notes:</strong> {post.revisionNotes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => navigate(`/blog/writer/edit/${post._id}`)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Edit
                      </button>
                      {post.status === 'published' && (
                        <button
                          onClick={() => navigate(`/blog/post/${post.slug}`)}
                          className="px-4 py-2 text-sm font-medium text-[#B8860B] bg-[#B8860B]/10 rounded-lg hover:bg-[#B8860B]/20 transition-colors"
                        >
                          View Live
                        </button>
                      )}
                      {post.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleSubmit(post._id)}
                            disabled={submitMutation.isPending}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#B8860B] rounded-lg hover:bg-[#9A7209] transition-colors disabled:opacity-50"
                          >
                            Submit for Review
                          </button>
                          <button
                            onClick={() => handleDelete(post._id)}
                            disabled={deleteMutation.isPending}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BlogLayout>
  );
}

export default WriterDashboard;
