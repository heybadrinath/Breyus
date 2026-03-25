import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Send,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  FileCheck,
  FilePenLine,
  Archive,
  CheckCircle,
  XCircle,
  RotateCcw,
  Pin,
  Star,
  Lock,
  Globe,
  MessageSquare,
  Heart,
  AlertCircle,
  FileSearch,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard';
import { generateMockSparklineData } from '@/components/shared/Sparkline';
import { useToast } from '@/hooks/use-toast';
import {
  useBlogPosts,
  useBlogStats,
  useDeleteBlogPost,
  useRestoreBlogPost,
  usePublishBlogPost,
  useUnpublishBlogPost,
  useApproveBlogPost,
  useRejectBlogPost,
  useRequestRevision,
  useTogglePinned,
  useToggleFeatured,
} from '../hooks/useBlogs';
import type { BlogQueryParams, BlogPostListItem, BlogStatus } from '../types';
import { STATUS_LABELS, STATUS_COLORS } from '../types';

/**
 * BlogListPage - Admin page for managing blog posts with editorial workflow
 *
 * Features:
 * - KPI stats (total, published, submitted, in review, approved, drafts, rejected, deleted)
 * - Search and filter by status and access level
 * - Table with post details, status badges, and feature indicators
 * - Actions: Edit, Approve, Reject, Request Revision, Publish, Unpublish, Delete, Restore
 * - Toggle featured and pinned status
 * - Pagination
 */
export function BlogListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Fix: Query params state — initialize from URL and persist changes back to URL
  const [params, setParams] = useState<BlogQueryParams>(() => ({
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    category: searchParams.get('category') || undefined,
    status: (searchParams.get('status') as BlogStatus) || undefined,
    accessLevel: (searchParams.get('accessLevel') as 'public' | 'member_only') || undefined,
    search: searchParams.get('search') || undefined,
    includeDeleted: searchParams.get('includeDeleted') === 'true',
  }));
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  // Fix: Sync params to URL whenever they change
  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    if (params.page && params.page > 1) newSearchParams.set('page', String(params.page));
    if (params.search) newSearchParams.set('search', params.search);
    if (params.status) newSearchParams.set('status', params.status);
    if (params.accessLevel) newSearchParams.set('accessLevel', params.accessLevel);
    if (params.category) newSearchParams.set('category', params.category);
    if (params.includeDeleted) newSearchParams.set('includeDeleted', 'true');

    // Only update if different to avoid infinite loops
    const currentParams = searchParams.toString();
    const newParams = newSearchParams.toString();
    if (currentParams !== newParams) {
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [params, searchParams, setSearchParams]);

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    post: BlogPostListItem | null;
  }>({ open: false, post: null });

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    post: BlogPostListItem | null;
    reason: string;
  }>({ open: false, post: null, reason: '' });

  const [revisionDialog, setRevisionDialog] = useState<{
    open: boolean;
    post: BlogPostListItem | null;
    notes: string;
  }>({ open: false, post: null, notes: '' });

  // Queries
  const { data, isLoading, error } = useBlogPosts(params);
  const { data: stats, isLoading: statsLoading } = useBlogStats();

  // Mutations
  const deleteMutation = useDeleteBlogPost();
  const restoreMutation = useRestoreBlogPost();
  const publishMutation = usePublishBlogPost();
  const unpublishMutation = useUnpublishBlogPost();
  const approveMutation = useApproveBlogPost();
  const rejectMutation = useRejectBlogPost();
  const revisionMutation = useRequestRevision();
  const togglePinnedMutation = useTogglePinned();
  const toggleFeaturedMutation = useToggleFeatured();

  // Sparkline data
  const sparklineData = useMemo(
    () => ({
      total: generateMockSparklineData(7, stats?.total ?? 10, 0.1),
      published: generateMockSparklineData(7, stats?.published ?? 8, 0.12),
      submitted: generateMockSparklineData(7, stats?.submitted ?? 2, 0.2),
      inReview: generateMockSparklineData(7, stats?.inReview ?? 1, 0.25),
      approved: generateMockSparklineData(7, stats?.approved ?? 1, 0.2),
      drafts: generateMockSparklineData(7, stats?.drafts ?? 2, 0.2),
      rejected: generateMockSparklineData(7, stats?.rejected ?? 0, 0.3),
      deleted: generateMockSparklineData(7, stats?.deleted ?? 0, 0.3),
    }),
    [stats]
  );

  // Handlers
  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setParams((prev) => ({
      ...prev,
      status: value === 'all' ? undefined : (value as BlogStatus),
      page: 1,
    }));
  };

  const handleAccessLevelFilter = (value: string) => {
    setParams((prev) => ({
      ...prev,
      accessLevel: value === 'all' ? undefined : (value as 'public' | 'member_only'),
      page: 1,
    }));
  };

  // Fix: Add category filter handler
  const handleCategoryFilter = (value: string) => {
    setParams((prev) => ({
      ...prev,
      category: value === 'all' ? undefined : value,
      page: 1,
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setParams({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setSearchInput('');
  };

  const handleDelete = async () => {
    if (!deleteDialog.post) return;

    try {
      await deleteMutation.mutateAsync(deleteDialog.post._id);
      toast({
        title: 'Post deleted',
        description: 'The blog post has been moved to trash.',
      });
      setDeleteDialog({ open: false, post: null });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const handleRestore = async (postId: string) => {
    try {
      await restoreMutation.mutateAsync(postId);
      toast({
        title: 'Post restored',
        description: 'The blog post has been restored.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to restore post',
        variant: 'destructive',
      });
    }
  };

  const handlePublish = async (postId: string) => {
    try {
      await publishMutation.mutateAsync(postId);
      toast({
        title: 'Post published',
        description: 'The blog post is now live.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to publish post',
        variant: 'destructive',
      });
    }
  };

  const handleUnpublish = async (postId: string) => {
    try {
      await unpublishMutation.mutateAsync(postId);
      toast({
        title: 'Post unpublished',
        description: 'The blog post has been reverted to draft.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to unpublish post',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      await approveMutation.mutateAsync(postId);
      toast({
        title: 'Post approved',
        description: 'The blog post has been approved and is ready to publish.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to approve post',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.post || !rejectDialog.reason.trim()) return;

    try {
      await rejectMutation.mutateAsync({
        postId: rejectDialog.post._id,
        reason: rejectDialog.reason,
      });
      toast({
        title: 'Post rejected',
        description: 'The blog post has been rejected with feedback.',
      });
      setRejectDialog({ open: false, post: null, reason: '' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to reject post',
        variant: 'destructive',
      });
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionDialog.post || !revisionDialog.notes.trim()) return;

    try {
      await revisionMutation.mutateAsync({
        postId: revisionDialog.post._id,
        notes: revisionDialog.notes,
      });
      toast({
        title: 'Revision requested',
        description: 'The writer has been notified to make changes.',
      });
      setRevisionDialog({ open: false, post: null, notes: '' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to request revision',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePinned = async (postId: string) => {
    try {
      await togglePinnedMutation.mutateAsync(postId);
      toast({
        title: 'Pinned status updated',
        description: 'The post pinned status has been toggled.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to toggle pinned',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async (postId: string) => {
    try {
      await toggleFeaturedMutation.mutateAsync(postId);
      toast({
        title: 'Featured status updated',
        description: 'The post featured status has been toggled.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to toggle featured',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: BlogStatus) => {
    const colors = STATUS_COLORS[status];
    const label = STATUS_LABELS[status];
    return (
      <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border}`}>
        {label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if post is in a reviewable state
  const isReviewable = (status: BlogStatus) =>
    status === 'submitted' || status === 'in_review';

  // Check if post can be published
  const canPublish = (status: BlogStatus) => status === 'approved';

  // Check if post can be unpublished
  const canUnpublish = (status: BlogStatus) => status === 'published';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
          <p className="text-muted-foreground">
            Create, review, and manage blog posts with editorial workflow
          </p>
        </div>
        <Button onClick={() => navigate('/blog/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Stats Cards - Row 1 */}
      <PremiumStatCardGrid columns={4}>
        <PremiumStatCard
          title="Total Posts"
          subtitle="All blog posts"
          value={stats?.total ?? 0}
          icon={BookOpen}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={sparklineData.total}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Published"
          subtitle="Live posts"
          value={stats?.published ?? 0}
          icon={FileCheck}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={sparklineData.published}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Pending Review"
          subtitle="Submitted + In Review"
          value={(stats?.submitted ?? 0) + (stats?.inReview ?? 0)}
          icon={FileSearch}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
          sparklineData={sparklineData.submitted}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Approved"
          subtitle="Ready to publish"
          value={stats?.approved ?? 0}
          icon={CheckCircle}
          iconColor="text-teal-500"
          iconBgColor="bg-teal-500/10"
          sparklineData={sparklineData.approved}
          isLoading={statsLoading}
        />
      </PremiumStatCardGrid>

      {/* Stats Cards - Row 2 */}
      <PremiumStatCardGrid columns={4}>
        <PremiumStatCard
          title="Drafts"
          subtitle="Work in progress"
          value={stats?.drafts ?? 0}
          icon={FilePenLine}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
          sparklineData={sparklineData.drafts}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Member Only"
          subtitle="Restricted access"
          value={stats?.memberOnly ?? 0}
          icon={Lock}
          iconColor="text-indigo-500"
          iconBgColor="bg-indigo-500/10"
          sparklineData={sparklineData.total}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Pinned"
          subtitle="Pinned post"
          value={stats?.pinned ?? 0}
          icon={Pin}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={sparklineData.published}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Deleted"
          subtitle="Soft deleted"
          value={stats?.deleted ?? 0}
          icon={Archive}
          iconColor="text-red-500"
          iconBgColor="bg-red-500/10"
          sparklineData={sparklineData.deleted}
          isLoading={statsLoading}
        />
      </PremiumStatCardGrid>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search posts by title, excerpt, or tags..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-md"
              />
              <Button variant="secondary" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select
                value={params.status || 'all'}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="revision_requested">Revision Requested</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={params.accessLevel || 'all'}
                onValueChange={handleAccessLevelFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Access</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="member_only">Member Only</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={params.includeDeleted ? 'true' : 'false'}
                onValueChange={(v) =>
                  setParams((prev) => ({
                    ...prev,
                    includeDeleted: v === 'true',
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Show deleted" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Active Only</SelectItem>
                  <SelectItem value="true">Include Deleted</SelectItem>
                </SelectContent>
              </Select>

              {/* Fix: Category filter input */}
              {params.category && (
                <Badge variant="secondary" className="h-9 px-3 flex items-center gap-2">
                  Category: {params.category}
                  <button
                    onClick={() => handleCategoryFilter('all')}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {/* Clear all filters button - shown when any filter is active */}
              {(params.search || params.status || params.accessLevel || params.category || params.includeDeleted) && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blog Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-destructive">
              Failed to load blog posts
            </div>
          ) : !data?.posts.length ? (
            <div className="flex flex-col items-center justify-center h-64">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No posts found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first blog post.
              </p>
              <Button onClick={() => navigate('/blog/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow className="border-b-2">
                      <TableHead className="w-[40%] py-4">Post</TableHead>
                      <TableHead className="w-[15%] py-4">Author</TableHead>
                      <TableHead className="w-[12%] py-4">Status</TableHead>
                      <TableHead className="w-[10%] py-4 text-center">Engagement</TableHead>
                      <TableHead className="w-[15%] py-4">Published</TableHead>
                      <TableHead className="w-[8%] py-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.posts.map((post) => (
                      <TableRow
                        key={post._id}
                        className="cursor-pointer hover:bg-muted/50 group"
                        onClick={() => navigate(`/blog/${post._id}/edit`)}
                      >
                        {/* Post: Image + Title + Excerpt */}
                        <TableCell className="py-5">
                          <div className="flex items-center gap-4">
                            {post.featuredImage ? (
                              <img
                                src={post.featuredImage}
                                alt=""
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border shadow-sm"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                                  {post.title}
                                </h4>
                                {post.isPinned && (
                                  <Pin className="h-4 w-4 text-blue-500 fill-blue-500 flex-shrink-0" />
                                )}
                                {post.isFeatured && (
                                  <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1 mb-1.5">
                                {post.excerpt || 'No excerpt available'}
                              </p>
                              <div className="flex items-center gap-2">
                                {post.accessLevel === 'member_only' ? (
                                  <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Members
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                    <Globe className="h-3 w-3 mr-1" />
                                    Public
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {post.readTime} min read
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Author */}
                        <TableCell className="py-5">
                          {post.writerDisplayName ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 border">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <span className="text-sm font-medium truncate max-w-[100px]">
                                {post.writerDisplayName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-5">
                          {getStatusBadge(post.status)}
                        </TableCell>

                        {/* Engagement - Stacked vertically for clarity */}
                        <TableCell className="py-5">
                          <div className="flex flex-col items-center gap-1 text-sm">
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <span className="flex items-center gap-1" title="Views">
                                <Eye className="h-4 w-4" />
                                <span className="min-w-[24px]">{post.viewCount}</span>
                              </span>
                              <span className="flex items-center gap-1" title="Likes">
                                <Heart className="h-4 w-4" />
                                <span className="min-w-[24px]">{post.likeCount}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground" title="Comments">
                              <MessageSquare className="h-4 w-4" />
                              <span>{post.commentCount} comments</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Published Date */}
                        <TableCell className="py-5 text-muted-foreground">
                          <div className="text-sm">
                            {formatDate(post.createdAt)}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-5">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/blog/${post._id}/edit`);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Editorial workflow actions */}
                            {isReviewable(post.status) && (
                              <>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApprove(post._id);
                                  }}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRevisionDialog({ open: true, post, notes: '' });
                                  }}
                                  className="text-orange-600"
                                >
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  Request Revision
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRejectDialog({ open: true, post, reason: '' });
                                  }}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}

                            {/* Publishing actions */}
                            {canPublish(post.status) && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePublish(post._id);
                                }}
                                className="text-green-600"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}

                            {canUnpublish(post.status) && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnpublish(post._id);
                                }}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Unpublish
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {/* Pin toggle */}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePinned(post._id);
                              }}
                            >
                              <Pin className={`h-4 w-4 mr-2 ${post.isPinned ? 'fill-blue-500 text-blue-500' : ''}`} />
                              {post.isPinned ? 'Unpin' : 'Pin'}
                            </DropdownMenuItem>

                            {/* Feature toggle */}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFeatured(post._id);
                              }}
                            >
                              <Star className={`h-4 w-4 mr-2 ${post.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                              {post.isFeatured ? 'Unfeature' : 'Feature'}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Delete / Restore */}
                            {post.isDeleted ? (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestore(post._id);
                                }}
                                className="text-green-600"
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restore
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteDialog({ open: true, post });
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

              {/* Pagination */}
              {data.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(data.page - 1) * data.limit + 1} to{' '}
                    {Math.min(data.page * data.limit, data.total)} of {data.total}{' '}
                    posts
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page <= 1}
                      onClick={() =>
                        setParams((prev) => ({ ...prev, page: prev.page! - 1 }))
                      }
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page >= data.pages}
                      onClick={() =>
                        setParams((prev) => ({ ...prev, page: prev.page! + 1 }))
                      }
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, post: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.post?.title}"? This
              action can be reversed by restoring the post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) =>
          !open && setRejectDialog({ open: false, post: null, reason: '' })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Blog Post</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting "{rejectDialog.post?.title}". This will
              be shared with the author.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this post is being rejected..."
                value={rejectDialog.reason}
                onChange={(e) =>
                  setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRejectDialog({ open: false, post: null, reason: '' })
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectDialog.reason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Post
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Revision Dialog */}
      <Dialog
        open={revisionDialog.open}
        onOpenChange={(open) =>
          !open && setRevisionDialog({ open: false, post: null, notes: '' })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              Provide feedback for "{revisionDialog.post?.title}". The author will be
              asked to make changes based on your notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="revision-notes">Revision Notes</Label>
              <Textarea
                id="revision-notes"
                placeholder="Describe what changes are needed..."
                value={revisionDialog.notes}
                onChange={(e) =>
                  setRevisionDialog((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRevisionDialog({ open: false, post: null, notes: '' })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={!revisionDialog.notes.trim() || revisionMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {revisionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Request Revision
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
