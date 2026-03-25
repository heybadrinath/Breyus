import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Eye,
  EyeOff,
  Trash2,
  MoreHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Check,
  Calendar,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard';
import { generateMockSparklineData } from '@/components/shared/Sparkline';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface BlogComment {
  _id: string;
  blogPostId: {
    _id: string;
    title: string;
    slug: string;
  };
  blogUserId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    isBrèyusMember: boolean;
  };
  content: string;
  parentId?: string;
  isFlagged: boolean;
  flagCount: number;
  flagReasons: string[];
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CommentsResponse {
  comments: BlogComment[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface CommentStats {
  total: number;
  flagged: number;
  hidden: number;
  today: number;
}

/**
 * CommentsPage - Admin page for moderating blog comments
 *
 * Features:
 * - View all comments with filters
 * - Flagged comments queue
 * - Hide/unhide comments
 * - Delete comments
 * - View comment context
 */
export function CommentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    comment: BlogComment | null;
  }>({ open: false, comment: null });

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'comments', activeTab, searchQuery, page],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit };
      if (searchQuery) params.search = searchQuery;
      if (activeTab === 'flagged') params.flagged = true;
      if (activeTab === 'hidden') params.hidden = true;

      const response = await api.get<{ data: CommentsResponse }>('/admin/blog/comments', { params });
      return response.data.data;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'comments', 'stats'],
    queryFn: async () => {
      const response = await api.get<{ data: CommentStats }>('/admin/blog/comments/stats');
      return response.data.data;
    },
  });

  // Mutations
  const hideCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.patch(`/admin/blog/comments/${commentId}`, { isHidden: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
      toast({ title: 'Comment hidden', description: 'The comment is now hidden from public view.' });
    },
  });

  const unhideCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.patch(`/admin/blog/comments/${commentId}`, { isHidden: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
      toast({ title: 'Comment restored', description: 'The comment is now visible.' });
    },
  });

  const clearFlagMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.post(`/admin/blog/comments/${commentId}/clear-flags`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
      toast({ title: 'Flags cleared', description: 'All flags have been cleared from this comment.' });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/admin/blog/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
      toast({ title: 'Comment deleted', description: 'The comment has been permanently deleted.' });
      setDeleteDialog({ open: false, comment: null });
    },
  });

  // Handlers
  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Sparkline data
  const sparklineData = useMemo(() => ({
    total: generateMockSparklineData(7, stats?.total ?? 50, 0.1),
    flagged: generateMockSparklineData(7, stats?.flagged ?? 5, 0.3),
    hidden: generateMockSparklineData(7, stats?.hidden ?? 2, 0.2),
    today: generateMockSparklineData(7, stats?.today ?? 10, 0.25),
  }), [stats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comment Moderation</h1>
        <p className="text-muted-foreground">
          Review and moderate blog comments
        </p>
      </div>

      {/* Stats Cards */}
      <PremiumStatCardGrid columns={4}>
        <PremiumStatCard
          title="Total Comments"
          subtitle="All time"
          value={stats?.total ?? 0}
          icon={MessageSquare}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={sparklineData.total}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Flagged"
          subtitle="Needs review"
          value={stats?.flagged ?? 0}
          icon={Flag}
          iconColor="text-orange-500"
          iconBgColor="bg-orange-500/10"
          sparklineData={sparklineData.flagged}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Hidden"
          subtitle="Not visible"
          value={stats?.hidden ?? 0}
          icon={EyeOff}
          iconColor="text-gray-500"
          iconBgColor="bg-gray-500/10"
          sparklineData={sparklineData.hidden}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Today"
          subtitle="New comments"
          value={stats?.today ?? 0}
          icon={Calendar}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={sparklineData.today}
          isLoading={statsLoading}
        />
      </PremiumStatCardGrid>

      {/* Tabs and Filters */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All Comments</TabsTrigger>
            <TabsTrigger value="flagged" className="flex items-center gap-1">
              <Flag className="h-4 w-4" />
              Flagged
              {stats?.flagged && stats.flagged > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {stats.flagged}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="hidden">Hidden</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Input
              placeholder="Search comments..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="max-w-xs"
            />
            <Button variant="secondary" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {activeTab === 'flagged' ? 'Flagged Comments' :
                 activeTab === 'hidden' ? 'Hidden Comments' : 'All Comments'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64 text-destructive">
                  Failed to load comments
                </div>
              ) : !data?.comments.length ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No comments found</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'flagged'
                      ? 'No flagged comments to review.'
                      : activeTab === 'hidden'
                      ? 'No hidden comments.'
                      : 'No comments yet.'}
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Author</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead>Post</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.comments.map((comment) => (
                        <TableRow key={comment._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {getInitials(comment.blogUserId.firstName, comment.blogUserId.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">
                                  {comment.blogUserId.firstName} {comment.blogUserId.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {comment.blogUserId.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm line-clamp-2 max-w-md">{comment.content}</p>
                            {comment.isFlagged && comment.flagReasons.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {comment.flagReasons.map((reason, i) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-orange-50 text-orange-600 border-orange-200">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <a
                              href={`/blog/post/${comment.blogPostId.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              <span className="line-clamp-1 max-w-[150px]">{comment.blogPostId.title}</span>
                            </a>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {comment.isHidden && (
                                <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Hidden
                                </Badge>
                              )}
                              {comment.isFlagged && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                                  <Flag className="h-3 w-3 mr-1" />
                                  {comment.flagCount} flags
                                </Badge>
                              )}
                              {comment.blogUserId.isBrèyusMember && (
                                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                  <Check className="h-3 w-3 mr-1" />
                                  Member
                                </Badge>
                              )}
                              {!comment.isHidden && !comment.isFlagged && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Visible
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(comment.createdAt)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {comment.isHidden ? (
                                  <DropdownMenuItem
                                    onClick={() => unhideCommentMutation.mutate(comment._id)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Unhide
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => hideCommentMutation.mutate(comment._id)}
                                  >
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Hide
                                  </DropdownMenuItem>
                                )}
                                {comment.isFlagged && (
                                  <DropdownMenuItem
                                    onClick={() => clearFlagMutation.mutate(comment._id)}
                                    className="text-green-600"
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Clear Flags
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteDialog({ open: true, comment })}
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
                        {Math.min(data.page * data.limit, data.total)} of {data.total} comments
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={data.page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={data.page >= data.pages}
                          onClick={() => setPage((p) => p + 1)}
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
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, comment: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteDialog.comment && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="line-clamp-3">{deleteDialog.comment.content}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.comment && deleteCommentMutation.mutate(deleteDialog.comment._id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCommentMutation.isPending ? (
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
