import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Building2,
  Calendar,
  FileText,
  Eye,
  Heart,
  MessageCircle,
  Loader2,
  Ban,
  CheckCircle,
  Trash2,
  UserCheck,
  PenTool,
  UserPlus,
  UserMinus,
  Clock,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard';
import { generateMockSparklineData } from '@/components/shared/Sparkline';
import { useToast } from '@/hooks/use-toast';
import {
  useBlogUser,
  useSuspendBlogUser,
  useUnsuspendBlogUser,
  useDeleteBlogUser,
  usePromoteToWriter,
  useRevokeWriterStatus,
} from '../hooks/useBlogs';

/**
 * BlogUserDetailPage - Admin page for viewing and managing a single blog user
 *
 * Features:
 * - User profile information
 * - Account status badges (Breyus Member, Writer, Suspended)
 * - Activity stats (if writer: posts, views, likes)
 * - Actions: Suspend/Unsuspend, Promote/Revoke Writer, Delete
 */
export function BlogUserDetailPage() {
  const { id: userId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Dialog states
  const [suspendDialog, setSuspendDialog] = useState<{
    open: boolean;
    reason: string;
  }>({ open: false, reason: '' });
  const [unsuspendDialog, setUnsuspendDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [promoteDialog, setPromoteDialog] = useState(false);
  const [revokeDialog, setRevokeDialog] = useState(false);

  // Queries
  const { data, isLoading, error } = useBlogUser(userId || '');

  // Mutations
  const suspendMutation = useSuspendBlogUser();
  const unsuspendMutation = useUnsuspendBlogUser();
  const deleteMutation = useDeleteBlogUser();
  const promoteMutation = usePromoteToWriter();
  const revokeMutation = useRevokeWriterStatus();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error || !data?.user) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">User not found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This user may have been deleted or does not exist.
        </p>
        <Button onClick={() => navigate('/blog/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  const { user, postStats, readerStats } = data;

  // Handlers
  const handleSuspend = async () => {
    if (!suspendDialog.reason.trim()) return;

    try {
      await suspendMutation.mutateAsync({
        userId: user._id,
        reason: suspendDialog.reason,
      });
      toast({
        title: 'User suspended',
        description: `${user.firstName} ${user.lastName} has been suspended.`,
      });
      setSuspendDialog({ open: false, reason: '' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to suspend user',
        variant: 'destructive',
      });
    }
  };

  const handleUnsuspend = async () => {
    try {
      await unsuspendMutation.mutateAsync(user._id);
      toast({
        title: 'User unsuspended',
        description: `${user.firstName} ${user.lastName} has been unsuspended.`,
      });
      setUnsuspendDialog(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to unsuspend user',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(user._id);
      toast({
        title: 'User deleted',
        description: `${user.firstName} ${user.lastName} has been deleted.`,
      });
      navigate('/blog/users');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handlePromote = async () => {
    try {
      await promoteMutation.mutateAsync(user._id);
      toast({
        title: 'User promoted',
        description: `${user.firstName} ${user.lastName} is now a writer.`,
      });
      setPromoteDialog(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to promote user',
        variant: 'destructive',
      });
    }
  };

  const handleRevoke = async () => {
    try {
      await revokeMutation.mutateAsync(user._id);
      toast({
        title: 'Writer status revoked',
        description: `${user.firstName} ${user.lastName} is no longer a writer.`,
      });
      setRevokeDialog(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to revoke writer status',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/blog/users')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground">
            View and manage blog user account
          </p>
        </div>
        <div className="flex gap-2">
          {/* Writer Actions */}
          {user.isWriter ? (
            <Button
              variant="outline"
              onClick={() => setRevokeDialog(true)}
              className="text-amber-600 border-amber-300 hover:bg-amber-50"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Revoke Writer
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setPromoteDialog(true)}
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Promote to Writer
            </Button>
          )}

          {/* Suspend/Unsuspend */}
          {user.isSuspended ? (
            <Button
              variant="outline"
              onClick={() => setUnsuspendDialog(true)}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Unsuspend
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setSuspendDialog({ open: true, reason: '' })}
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspend
            </Button>
          )}

          {/* Delete */}
          <Button
            variant="destructive"
            onClick={() => setDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Suspended Warning Banner */}
      {user.isSuspended && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Account Suspended</h3>
            <p className="text-sm text-red-700">
              This user was suspended on {user.suspendedAt && formatDateTime(user.suspendedAt)}.
            </p>
            {user.suspensionReason && (
              <p className="text-sm text-red-600 mt-1">
                <strong>Reason:</strong> {user.suspensionReason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold">
                    {user.firstName} {user.lastName}
                  </h2>
                  {/* Account Type Badge */}
                  {user.isBrèyusMember ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Breyus Member
                    </Badge>
                  ) : (
                    <Badge variant="outline">Blog Reader</Badge>
                  )}
                  {/* Writer Badge */}
                  {user.isWriter && (
                    <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                      <PenTool className="h-3 w-3 mr-1" />
                      Writer
                    </Badge>
                  )}
                  {/* Status Badge */}
                  {user.isSuspended ? (
                    <Badge variant="destructive">
                      <Ban className="h-3 w-3 mr-1" />
                      Suspended
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-600 border-green-500/20"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.companyName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.companyName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Joined {formatDate(user.createdAt)}</span>
                </div>
              </div>
              {user.lastLoginAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Last login: {formatDateTime(user.lastLoginAt)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - Only show if writer */}
      {user.isWriter && postStats && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Writer Statistics</h3>
          <PremiumStatCardGrid columns={4}>
            <PremiumStatCard
              title="Total Posts"
              subtitle="All posts"
              value={postStats.totalPosts}
              icon={FileText}
              iconColor="text-blue-500"
              iconBgColor="bg-blue-500/10"
              sparklineData={generateMockSparklineData(7, postStats.totalPosts, 0.1)}
              isLoading={false}
            />
            <PremiumStatCard
              title="Published"
              subtitle="Live posts"
              value={postStats.publishedPosts}
              icon={CheckCircle}
              iconColor="text-green-500"
              iconBgColor="bg-green-500/10"
              sparklineData={generateMockSparklineData(7, postStats.publishedPosts, 0.15)}
              isLoading={false}
            />
            <PremiumStatCard
              title="Total Views"
              subtitle="All time views"
              value={postStats.totalViews}
              icon={Eye}
              iconColor="text-purple-500"
              iconBgColor="bg-purple-500/10"
              sparklineData={generateMockSparklineData(7, postStats.totalViews, 0.2)}
              isLoading={false}
            />
            <PremiumStatCard
              title="Total Likes"
              subtitle="All posts"
              value={postStats.totalLikes}
              icon={Heart}
              iconColor="text-red-500"
              iconBgColor="bg-red-500/10"
              sparklineData={generateMockSparklineData(7, postStats.totalLikes, 0.25)}
              isLoading={false}
            />
          </PremiumStatCardGrid>
        </div>
      )}

      {/* Reader Engagement Section — for non-writers */}
      {!user.isWriter && readerStats && (
        readerStats.totalLikesGiven === 0 && readerStats.totalComments === 0 ? (
          // Quiet message for zero activity
          <Card>
            <CardContent className="py-10 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                This user hasn't interacted with any posts yet
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Likes and comments will appear here once they start engaging
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reader Activity</h3>

            {/* Stat Cards */}
            <PremiumStatCardGrid columns={2}>
              <PremiumStatCard
                title="Likes Given"
                subtitle="Posts liked"
                value={readerStats.totalLikesGiven}
                icon={Heart}
                iconColor="text-red-500"
                iconBgColor="bg-red-500/10"
                sparklineData={generateMockSparklineData(7, readerStats.totalLikesGiven, 0.2)}
                isLoading={false}
              />
              <PremiumStatCard
                title="Comments Posted"
                subtitle="All comments"
                value={readerStats.totalComments}
                icon={MessageCircle}
                iconColor="text-blue-500"
                iconBgColor="bg-blue-500/10"
                sparklineData={generateMockSparklineData(7, readerStats.totalComments, 0.25)}
                isLoading={false}
              />
            </PremiumStatCardGrid>

            {/* Recent Activity Feed */}
            {readerStats.recentActivity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {readerStats.recentActivity.map((activity) => (
                      <div
                        key={activity._id}
                        className="flex items-start gap-3 py-2 border-b last:border-0"
                      >
                        {/* Activity Icon */}
                        <div
                          className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            activity.type === 'like'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-blue-500/10 text-blue-500'
                          }`}
                        >
                          {activity.type === 'like' ? (
                            <Heart className="h-4 w-4" />
                          ) : (
                            <MessageCircle className="h-4 w-4" />
                          )}
                        </div>

                        {/* Activity Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">
                              {activity.type === 'like' ? 'Liked' : 'Commented on'}
                            </span>{' '}
                            <button
                              type="button"
                              className="font-medium text-primary hover:underline"
                              onClick={() => {
                                if (activity.postSlug) {
                                  // Find the post ID from slug to navigate to admin editor
                                  navigate(`/blog?search=${encodeURIComponent(activity.postTitle)}`);
                                }
                              }}
                            >
                              {activity.postTitle}
                            </button>
                          </p>
                          {activity.type === 'comment' && activity.content && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              "{activity.content}"
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )
      )}

      {/* Account Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Detailed account information and timestamps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Account ID</span>
              <p className="font-mono text-sm">{user._id}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Account Type</span>
              <p className="text-sm">{user.isBrèyusMember ? 'Breyus Platform Member' : 'Blog-Only Account'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Created At</span>
              <p className="text-sm">{formatDateTime(user.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <p className="text-sm">{formatDateTime(user.updatedAt)}</p>
            </div>
            {user.lastLoginAt && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Last Login</span>
                <p className="text-sm">{formatDateTime(user.lastLoginAt)}</p>
              </div>
            )}
            {user.isSuspended && user.suspendedAt && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Suspended At</span>
                <p className="text-sm text-red-600">{formatDateTime(user.suspendedAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Suspend Dialog */}
      <Dialog
        open={suspendDialog.open}
        onOpenChange={(open) => !open && setSuspendDialog({ open: false, reason: '' })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend {user.firstName} {user.lastName}? They will not be able to log in
              or access the blog portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="suspend-reason">Reason for suspension</Label>
              <Textarea
                id="suspend-reason"
                placeholder="Enter the reason for suspending this user..."
                value={suspendDialog.reason}
                onChange={(e) =>
                  setSuspendDialog((prev) => ({ ...prev, reason: e.target.value }))
                }
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialog({ open: false, reason: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={!suspendDialog.reason.trim() || suspendMutation.isPending}
            >
              {suspendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suspending...
                </>
              ) : (
                'Suspend User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Dialog */}
      <AlertDialog open={unsuspendDialog} onOpenChange={setUnsuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsuspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unsuspend {user.firstName} {user.lastName}?
              They will regain access to the blog portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnsuspend}>
              {unsuspendMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unsuspending...
                </>
              ) : (
                'Unsuspend User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {user.firstName} {user.lastName}?
              This action cannot be undone. All their data will be permanently removed.
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
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote to Writer Dialog */}
      <AlertDialog open={promoteDialog} onOpenChange={setPromoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Writer</AlertDialogTitle>
            <AlertDialogDescription>
              Promote {user.firstName} {user.lastName} to writer status?
              They will be able to create and publish blog posts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote}>
              {promoteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Promoting...
                </>
              ) : (
                'Promote to Writer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Writer Status Dialog */}
      <AlertDialog open={revokeDialog} onOpenChange={setRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Writer Status</AlertDialogTitle>
            <AlertDialogDescription>
              Revoke writer status from {user.firstName} {user.lastName}?
              They will no longer be able to create new blog posts.
              Existing posts will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {revokeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke Writer Status'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default BlogUserDetailPage;
