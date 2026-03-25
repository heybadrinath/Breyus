import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Eye,
  Trash2,
  MoreHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  FileText,
  TrendingUp,
  Calendar,
  Building2,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useWriters, useRemoveWriter } from '../hooks/useBlogs';
import type { BlogWriter } from '../types';

/**
 * WritersPage - Admin page for managing blog writers
 *
 * Features:
 * - KPI stats (total writers, Breyus members, total posts, total views)
 * - Search writers by name or email
 * - Table with writer details and stats
 * - Actions: View, Remove writer status
 */
export function WritersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Dialog states
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    writer: BlogWriter | null;
  }>({ open: false, writer: null });

  // Queries
  const { data: writers, isLoading, error } = useWriters();

  // Mutations
  const removeWriterMutation = useRemoveWriter();

  // Filter writers by search
  const filteredWriters = writers?.filter((writer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      writer.email.toLowerCase().includes(query) ||
      writer.firstName.toLowerCase().includes(query) ||
      writer.lastName.toLowerCase().includes(query) ||
      writer.companyName?.toLowerCase().includes(query)
    );
  }) || [];

  // Paginate
  const paginatedWriters = filteredWriters.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filteredWriters.length / limit);

  // Calculate stats
  const totalWriters = writers?.length || 0;
  const breyusMembers = writers?.filter(w => w.isBrèyusMember).length || 0;
  const totalPosts = writers?.reduce((sum, w) => sum + w.postCount, 0) || 0;
  const totalViews = writers?.reduce((sum, w) => sum + w.totalViews, 0) || 0;

  // Handlers
  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleRemove = async () => {
    if (!removeDialog.writer) return;

    try {
      await removeWriterMutation.mutateAsync(removeDialog.writer._id);
      toast({
        title: 'Writer removed',
        description: 'The user is no longer a writer.',
      });
      setRemoveDialog({ open: false, writer: null });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Writers</h1>
          <p className="text-muted-foreground">
            Manage blog writers and their contributions
          </p>
        </div>
        <Button onClick={() => navigate('/blog/invites')}>
          <Mail className="h-4 w-4 mr-2" />
          Manage Invites
        </Button>
      </div>

      {/* Stats Cards */}
      <PremiumStatCardGrid columns={4}>
        <PremiumStatCard
          title="Total Writers"
          subtitle="Active writers"
          value={totalWriters}
          icon={Users}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={generateMockSparklineData(7, totalWriters, 0.1)}
          isLoading={isLoading}
        />
        <PremiumStatCard
          title="Breyus Members"
          subtitle="Writers who are members"
          value={breyusMembers}
          icon={UserCheck}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={generateMockSparklineData(7, breyusMembers, 0.15)}
          isLoading={isLoading}
        />
        <PremiumStatCard
          title="Total Posts"
          subtitle="All writer posts"
          value={totalPosts}
          icon={FileText}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
          sparklineData={generateMockSparklineData(7, totalPosts, 0.12)}
          isLoading={isLoading}
        />
        <PremiumStatCard
          title="Total Views"
          subtitle="Combined views"
          value={totalViews}
          icon={TrendingUp}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
          sparklineData={generateMockSparklineData(7, totalViews, 0.2)}
          isLoading={isLoading}
        />
      </PremiumStatCardGrid>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search writers by name, email, or company..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="max-w-md"
            />
            <Button variant="secondary" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Writers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-destructive">
              Failed to load writers
            </div>
          ) : !paginatedWriters.length ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No writers found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Invite users to become writers.
              </p>
              <Button onClick={() => navigate('/blog/invites')}>
                <Mail className="h-4 w-4 mr-2" />
                Manage Invites
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Writer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedWriters.map((writer) => (
                    <TableRow
                      key={writer._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/blog/writers/${writer._id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={writer.writerAvatar} />
                            <AvatarFallback>
                              {getInitials(writer.firstName, writer.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {writer.firstName} {writer.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {writer.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {writer.companyName ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {writer.companyName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {writer.isBrèyusMember ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Breyus Member
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            External Writer
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {writer.postCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          {writer.totalViews.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(writer.writerApprovedAt || writer.createdAt)}
                        </div>
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
                                navigate(`/blog/writers/${writer._id}`);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/blog/author/${writer._id}`, '_blank');
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Public Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRemoveDialog({ open: true, writer });
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Writer Status
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to{' '}
                    {Math.min(page * limit, filteredWriters.length)} of{' '}
                    {filteredWriters.length} writers
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
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

      {/* Remove Writer Dialog */}
      <AlertDialog
        open={removeDialog.open}
        onOpenChange={(open) =>
          !open && setRemoveDialog({ open: false, writer: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Writer Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove writer status from{' '}
              {removeDialog.writer?.firstName} {removeDialog.writer?.lastName}? They
              will no longer be able to create or edit blog posts.
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
