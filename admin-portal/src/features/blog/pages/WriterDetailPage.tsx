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
  MessageSquare,
  TrendingUp,
  Loader2,
  ExternalLink,
  Trash2,
  UserCheck,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard';
import { generateMockSparklineData } from '@/components/shared/Sparkline';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useWriters, useBlogPosts, useRemoveWriter } from '../hooks/useBlogs';
import { STATUS_LABELS, STATUS_COLORS } from '../types';
import type { BlogStatus } from '../types';

/**
 * WriterDetailPage - Admin page for viewing writer details and their posts
 *
 * Features:
 * - Writer profile information
 * - Stats (posts, views, likes, comments)
 * - List of writer's posts with status
 * - Remove writer status action
 */
export function WriterDetailPage() {
  const { writerId } = useParams<{ writerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Dialog states
  const [removeDialog, setRemoveDialog] = useState(false);

  // Queries
  const { data: writers, isLoading: writersLoading } = useWriters();
  const { data: postsData, isLoading: postsLoading } = useBlogPosts({
    writerId,
    limit: 100,
  });

  // Mutations
  const removeWriterMutation = useRemoveWriter();

  // Find writer
  const writer = writers?.find((w) => w._id === writerId);

  // Loading state
  if (writersLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not found
  if (!writer) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Writer not found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This writer may have been removed.
        </p>
        <Button onClick={() => navigate('/blog/writers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Writers
        </Button>
      </div>
    );
  }

  // Handlers
  const handleRemove = async () => {
    try {
      await removeWriterMutation.mutateAsync(writer._id);
      toast({
        title: 'Writer removed',
        description: 'The user is no longer a writer.',
      });
      navigate('/blog/writers');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to remove writer',
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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

  // Calculate engagement stats
  const totalLikes = postsData?.posts.reduce((sum, p) => sum + p.likeCount, 0) || 0;
  const totalComments = postsData?.posts.reduce((sum, p) => sum + p.commentCount, 0) || 0;
  const publishedPosts = postsData?.posts.filter((p) => p.status === 'published').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/blog/writers')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Writer Details</h1>
          <p className="text-muted-foreground">
            View writer profile and their contributions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(`/blog/author/${writer._id}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Public Profile
          </Button>
          <Button
            variant="destructive"
            onClick={() => setRemoveDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Writer
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={writer.writerAvatar} />
              <AvatarFallback className="text-2xl">
                {getInitials(writer.firstName, writer.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">
                    {writer.firstName} {writer.lastName}
                  </h2>
                  {writer.isBrèyusMember ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Breyus Member
                    </Badge>
                  ) : (
                    <Badge variant="outline">External Writer</Badge>
                  )}
                </div>
                {writer.writerBio && (
                  <p className="text-muted-foreground mt-2">{writer.writerBio}</p>
                )}
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{writer.email}</span>
                </div>
                {writer.companyName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{writer.companyName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Writer since {formatDate(writer.writerApprovedAt || writer.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <PremiumStatCardGrid columns={4}>
        <PremiumStatCard
          title="Total Posts"
          subtitle="All posts"
          value={writer.postCount}
          icon={FileText}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={generateMockSparklineData(7, writer.postCount, 0.1)}
          isLoading={false}
        />
        <PremiumStatCard
          title="Published"
          subtitle="Live posts"
          value={publishedPosts}
          icon={TrendingUp}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={generateMockSparklineData(7, publishedPosts, 0.15)}
          isLoading={postsLoading}
        />
        <PremiumStatCard
          title="Total Views"
          subtitle="Combined views"
          value={writer.totalViews}
          icon={Eye}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
          sparklineData={generateMockSparklineData(7, writer.totalViews, 0.2)}
          isLoading={false}
        />
        <PremiumStatCard
          title="Engagement"
          subtitle="Likes + Comments"
          value={totalLikes + totalComments}
          icon={Heart}
          iconColor="text-red-500"
          iconBgColor="bg-red-500/10"
          sparklineData={generateMockSparklineData(7, totalLikes + totalComments, 0.25)}
          isLoading={postsLoading}
        />
      </PremiumStatCardGrid>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Writer's Posts
          </CardTitle>
          <CardDescription>
            All blog posts created by this writer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !postsData?.posts.length ? (
            <div className="flex flex-col items-center justify-center h-48">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No posts yet</h3>
              <p className="text-sm text-muted-foreground">
                This writer hasn't created any posts yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postsData.posts.map((post) => (
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
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium line-clamp-1">{post.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {post.excerpt}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        {post.viewCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {post.commentCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4" />
                        {formatDate(post.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/blog/${post._id}/edit`);
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Remove Writer Dialog */}
      <AlertDialog open={removeDialog} onOpenChange={setRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Writer Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove writer status from{' '}
              {writer.firstName} {writer.lastName}? They will no longer be able to
              create or edit blog posts. Their existing posts will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeWriterMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Writer Status'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
