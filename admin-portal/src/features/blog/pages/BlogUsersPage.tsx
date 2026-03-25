import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  MoreHorizontal,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Calendar,
  Building2,
  Mail,
  X,
  UserX,
  PenTool,
  Clock,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard';
import { generateMockSparklineData } from '@/components/shared/Sparkline';
import { useToast } from '@/hooks/use-toast';
import {
  useBlogUsers,
  useBlogUsersStats,
  useSuspendBlogUser,
  useUnsuspendBlogUser,
  useDeleteBlogUser,
  usePromoteToWriter,
  useRevokeWriterStatus,
  type BlogUser,
  type BlogUserQueryParams,
} from '../hooks/useBlogs';

/**
 * BlogUsersPage - Admin page for managing blog portal users
 *
 * Features:
 * - KPI stats (total users, Breyus members, blog-only, writers, suspended)
 * - Search and filter users
 * - Table with user details
 * - Actions: View, Suspend, Unsuspend, Delete
 */
export function BlogUsersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<BlogUserQueryParams>({
    page: 1,
    limit: 20,
  });

  // Dialog states
  const [suspendDialog, setSuspendDialog] = useState<{
    open: boolean;
    user: BlogUser | null;
    reason: string;
  }>({ open: false, user: null, reason: '' });

  const [unsuspendDialog, setUnsuspendDialog] = useState<{
    open: boolean;
    user: BlogUser | null;
  }>({ open: false, user: null });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: BlogUser | null;
  }>({ open: false, user: null });

  const [promoteDialog, setPromoteDialog] = useState<{
    open: boolean;
    user: BlogUser | null;
  }>({ open: false, user: null });

  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean;
    user: BlogUser | null;
  }>({ open: false, user: null });

  // Queries
  const { data: usersData, isLoading, error } = useBlogUsers(filters);
  const { data: stats, isLoading: statsLoading } = useBlogUsersStats();

  // Mutations
  const suspendMutation = useSuspendBlogUser();
  const unsuspendMutation = useUnsuspendBlogUser();
  const deleteMutation = useDeleteBlogUser();
  const promoteMutation = usePromoteToWriter();
  const revokeMutation = useRevokeWriterStatus();

  // Handlers
  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput || undefined,
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof BlogUserQueryParams, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value === 'true' ? true : value === 'false' ? false : value,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ page: 1, limit: 20 });
  };

  const handleSuspend = async () => {
    if (!suspendDialog.user || !suspendDialog.reason.trim()) return;

    try {
      await suspendMutation.mutateAsync({
        userId: suspendDialog.user._id,
        reason: suspendDialog.reason,
      });
      toast({
        title: 'User suspended',
        description: `${suspendDialog.user.firstName} ${suspendDialog.user.lastName} has been suspended.`,
      });
      setSuspendDialog({ open: false, user: null, reason: '' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to suspend user',
        variant: 'destructive',
      });
    }
  };

  const handleUnsuspend = async () => {
    if (!unsuspendDialog.user) return;

    try {
      await unsuspendMutation.mutateAsync(unsuspendDialog.user._id);
      toast({
        title: 'User unsuspended',
        description: `${unsuspendDialog.user.firstName} ${unsuspendDialog.user.lastName} has been unsuspended.`,
      });
      setUnsuspendDialog({ open: false, user: null });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to unsuspend user',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.user) return;

    try {
      await deleteMutation.mutateAsync(deleteDialog.user._id);
      toast({
        title: 'User deleted',
        description: `${deleteDialog.user.firstName} ${deleteDialog.user.lastName} has been deleted.`,
      });
      setDeleteDialog({ open: false, user: null });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handlePromote = async () => {
    if (!promoteDialog.user) return;

    try {
      await promoteMutation.mutateAsync(promoteDialog.user._id);
      toast({
        title: 'User promoted',
        description: `${promoteDialog.user.firstName} ${promoteDialog.user.lastName} is now a writer.`,
      });
      setPromoteDialog({ open: false, user: null });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to promote user',
        variant: 'destructive',
      });
    }
  };

  const handleRevoke = async () => {
    if (!revokeDialog.user) return;

    try {
      await revokeMutation.mutateAsync(revokeDialog.user._id);
      toast({
        title: 'Writer status revoked',
        description: `${revokeDialog.user.firstName} ${revokeDialog.user.lastName} is no longer a writer.`,
      });
      setRevokeDialog({ open: false, user: null });
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const hasActiveFilters =
    filters.search ||
    filters.isBrèyusMember !== undefined ||
    filters.isWriter !== undefined ||
    filters.isSuspended !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Users</h1>
          <p className="text-muted-foreground">
            Manage all blog portal users and their access
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <PremiumStatCardGrid columns={3}>
        <PremiumStatCard
          title="Total Users"
          subtitle="All registered users"
          value={stats?.totalUsers || 0}
          icon={Users}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={generateMockSparklineData(7, stats?.totalUsers || 0, 0.1)}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Breyus Members"
          subtitle="Platform members"
          value={stats?.breyusMembers || 0}
          icon={UserCheck}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={generateMockSparklineData(7, stats?.breyusMembers || 0, 0.15)}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Blog-Only"
          subtitle="Reader accounts"
          value={stats?.blogOnlyUsers || 0}
          icon={Mail}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
          sparklineData={generateMockSparklineData(7, stats?.blogOnlyUsers || 0, 0.12)}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Writers"
          subtitle="Content creators"
          value={stats?.writers || 0}
          icon={PenTool}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
          sparklineData={generateMockSparklineData(7, stats?.writers || 0, 0.08)}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Suspended"
          subtitle="Blocked users"
          value={stats?.suspendedUsers || 0}
          icon={UserX}
          iconColor="text-red-500"
          iconBgColor="bg-red-500/10"
          sparklineData={generateMockSparklineData(7, stats?.suspendedUsers || 0, 0.05)}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Recent Signups"
          subtitle="Last 7 days"
          value={stats?.recentSignups || 0}
          icon={Clock}
          iconColor="text-cyan-500"
          iconBgColor="bg-cyan-500/10"
          sparklineData={generateMockSparklineData(7, stats?.recentSignups || 0, 0.25)}
          isLoading={statsLoading}
        />
      </PremiumStatCardGrid>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-md">
              <Input
                placeholder="Search by name, email, or company..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button variant="secondary" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>

            {/* Filter: Breyus Member */}
            <Select
              value={
                filters.isBrèyusMember === undefined
                  ? 'all'
                  : String(filters.isBrèyusMember)
              }
              onValueChange={(v) => handleFilterChange('isBrèyusMember', v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Member Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="true">Breyus Members</SelectItem>
                <SelectItem value="false">Blog-Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter: Writer */}
            <Select
              value={
                filters.isWriter === undefined ? 'all' : String(filters.isWriter)
              }
              onValueChange={(v) => handleFilterChange('isWriter', v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Writer Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Writers</SelectItem>
                <SelectItem value="false">Non-Writers</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter: Suspended */}
            <Select
              value={
                filters.isSuspended === undefined
                  ? 'all'
                  : String(filters.isSuspended)
              }
              onValueChange={(v) => handleFilterChange('isSuspended', v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Suspended</SelectItem>
                <SelectItem value="false">Active</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users
            {usersData?.total !== undefined && (
              <Badge variant="secondary" className="ml-2">
                {usersData.total}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-destructive">
              Failed to load users
            </div>
          ) : !usersData?.users?.length ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No users found</h3>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'No blog users registered yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData.users.map((user) => (
                    <TableRow
                      key={user._id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/blog/users/${user._id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.companyName ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {user.companyName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isBrèyusMember ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Breyus Member
                          </Badge>
                        ) : (
                          <Badge variant="outline">Blog Reader</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isWriter ? (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                            <PenTool className="h-3 w-3 mr-1" />
                            Writer
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Reader</span>
                        )}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/blog/users/${user._id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* Promote/Revoke Writer */}
                            {user.isWriter ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setRevokeDialog({ open: true, user })
                                }
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Revoke Writer
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setPromoteDialog({ open: true, user })
                                }
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Promote to Writer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {/* Suspend/Unsuspend */}
                            {user.isSuspended ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setUnsuspendDialog({ open: true, user })
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Unsuspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  setSuspendDialog({
                                    open: true,
                                    user,
                                    reason: '',
                                  })
                                }
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                setDeleteDialog({ open: true, user })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {usersData.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {usersData.page} of {usersData.pages} ({usersData.total}{' '}
                    users)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page === 1}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          page: (prev.page || 1) - 1,
                        }))
                      }
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usersData.page >= usersData.pages}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          page: (prev.page || 1) + 1,
                        }))
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

      {/* Suspend Dialog */}
      <Dialog
        open={suspendDialog.open}
        onOpenChange={(open) =>
          !open && setSuspendDialog({ open: false, user: null, reason: '' })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend {suspendDialog.user?.firstName} {suspendDialog.user?.lastName}?
              They will not be able to log in or access the blog portal.
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
              onClick={() =>
                setSuspendDialog({ open: false, user: null, reason: '' })
              }
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
      <AlertDialog
        open={unsuspendDialog.open}
        onOpenChange={(open) =>
          !open && setUnsuspendDialog({ open: false, user: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsuspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unsuspend {unsuspendDialog.user?.firstName}{' '}
              {unsuspendDialog.user?.lastName}? They will regain access to the blog
              portal.
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
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, user: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteDialog.user?.firstName}{' '}
              {deleteDialog.user?.lastName}? This action cannot be undone.
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
      <AlertDialog
        open={promoteDialog.open}
        onOpenChange={(open) =>
          !open && setPromoteDialog({ open: false, user: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Writer</AlertDialogTitle>
            <AlertDialogDescription>
              Promote {promoteDialog.user?.firstName}{' '}
              {promoteDialog.user?.lastName} to writer status? They will be able
              to create and publish blog posts.
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
      <AlertDialog
        open={revokeDialog.open}
        onOpenChange={(open) =>
          !open && setRevokeDialog({ open: false, user: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Writer Status</AlertDialogTitle>
            <AlertDialogDescription>
              Revoke writer status from {revokeDialog.user?.firstName}{' '}
              {revokeDialog.user?.lastName}? They will no longer be able to
              create new blog posts.
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

export default BlogUsersPage;
