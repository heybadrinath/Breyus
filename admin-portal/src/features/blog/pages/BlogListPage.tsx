import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard';
import { generateMockSparklineData } from '@/components/shared/Sparkline';
import { useToast } from '@/hooks/use-toast';
import {
  useBlogPosts,
  useBlogStats,
  useDeleteBlogPost,
  usePublishBlogPost,
  useUnpublishBlogPost,
} from '../hooks/useBlogs';
import type { BlogQueryParams, BlogPostListItem, BlogStatus } from '../types';

/**
 * BlogListPage - Admin page for managing blog posts
 *
 * Features:
 * - KPI stats (total, published, drafts, deleted)
 * - Search and filter by status
 * - Table with post details
 * - Actions: Edit, Publish/Unpublish, Delete, Restore
 * - Pagination
 */
export function BlogListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Query params state
  const [params, setParams] = useState<BlogQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    post: BlogPostListItem | null;
  }>({ open: false, post: null });

  // Queries
  const { data, isLoading, error } = useBlogPosts(params);
  const { data: stats, isLoading: statsLoading } = useBlogStats();

  // Mutations
  const deleteMutation = useDeleteBlogPost();
  const publishMutation = usePublishBlogPost();
  const unpublishMutation = useUnpublishBlogPost();

  // Sparkline data
  const sparklineData = useMemo(
    () => ({
      total: generateMockSparklineData(7, stats?.total ?? 10, 0.1),
      published: generateMockSparklineData(7, stats?.published ?? 8, 0.12),
      drafts: generateMockSparklineData(7, stats?.drafts ?? 2, 0.2),
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

  const handleDelete = async () => {
    if (!deleteDialog.post) return;

    try {
      await deleteMutation.mutateAsync(deleteDialog.post._id);
      toast({
        title: 'Post deleted',
        description: 'The blog post has been deleted.',
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
        description: 'The blog post is now a draft.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to unpublish post',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: BlogStatus) => {
    const variants: Record<BlogStatus, { color: string; label: string }> = {
      published: {
        color: 'bg-green-500/10 text-green-600 border-green-500/20',
        label: 'Published',
      },
      draft: {
        color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        label: 'Draft',
      },
    };
    const variant = variants[status];
    return (
      <Badge variant="outline" className={variant.color}>
        {variant.label}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
          <p className="text-muted-foreground">
            Create and manage blog posts for the marketplace
          </p>
        </div>
        <Button onClick={() => navigate('/blog/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Stats Cards */}
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
          title="Drafts"
          subtitle="Unpublished posts"
          value={stats?.drafts ?? 0}
          icon={FilePenLine}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
          sparklineData={sparklineData.drafts}
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search posts..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button variant="secondary" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Select
                value={params.status || 'all'}
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Read Time</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.posts.map((post) => (
                    <TableRow
                      key={post._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/blog/${post._id}/edit`)}
                    >
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {post.featuredImage && (
                            <img
                              src={post.featuredImage}
                              alt=""
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium line-clamp-1">
                              {post.title}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {post.excerpt}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {post.categories.slice(0, 2).map((cat) => (
                            <Badge key={cat} variant="secondary" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                          {post.categories.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{post.categories.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          {post.viewCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {post.readTimeMinutes} min
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(post.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/blog/${post._id}/edit`);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {post.status === 'draft' ? (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePublish(post._id);
                                }}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            ) : (
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
    </div>
  );
}
