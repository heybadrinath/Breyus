import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserX, UserCheck, Key, Download, Trash2, MoreHorizontal, ChevronLeft, ChevronRight, Users, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard'
import { generateMockSparklineData } from '@/components/shared/Sparkline'
import { useUsers, useUserStats, useSuspendUser, useUnsuspendUser, useDeleteUser, useForcePasswordReset, useExportUserData } from '../hooks/useUsers'
import type { User, UsersQueryParams } from '../types'

export function UsersPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // Query params state
  const [params, setParams] = useState<UsersQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = useState('')

  // Dialog states
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [suspendReason, setSuspendReason] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })

  // Queries and mutations
  const { data, isLoading, error } = useUsers(params)
  const { data: stats, isLoading: statsLoading } = useUserStats()

  // Generate sparkline data for trend visualization
  const sparklineData = useMemo(() => ({
    total: generateMockSparklineData(7, stats?.total ?? 100, 0.08),
    active: generateMockSparklineData(7, stats?.active ?? 90, 0.1),
    suspended: generateMockSparklineData(7, stats?.suspended ?? 5, 0.25),
    newThisMonth: generateMockSparklineData(7, stats?.newThisMonth ?? 10, 0.2),
  }), [stats])
  const suspendMutation = useSuspendUser()
  const unsuspendMutation = useUnsuspendUser()
  const deleteMutation = useDeleteUser()
  const resetPasswordMutation = useForcePasswordReset()
  const exportMutation = useExportUserData()

  const handleSearch = () => {
    setParams(prev => ({ ...prev, search: searchInput, page: 1 }))
  }

  const handleRoleFilter = (value: string) => {
    setParams(prev => ({
      ...prev,
      role:
        value === 'all'
          ? undefined
          : (value as 'Buyer' | 'Seller' | 'Seller and Buyer'),
      page: 1,
    }))
  }

  const handleSuspendedFilter = (value: string) => {
    setParams(prev => ({
      ...prev,
      isSuspended: value === 'all' ? undefined : value === 'true',
      page: 1,
    }))
  }

  const handleSuspend = async () => {
    if (!suspendDialog.user || !suspendReason.trim()) return

    try {
      await suspendMutation.mutateAsync({
        userId: suspendDialog.user._id,
        data: { reason: suspendReason },
      })
      toast({ title: 'User suspended', description: 'The user has been suspended successfully.' })
      setSuspendDialog({ open: false, user: null })
      setSuspendReason('')
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to suspend user', variant: 'destructive' })
    }
  }

  const handleUnsuspend = async (user: User) => {
    try {
      await unsuspendMutation.mutateAsync(user._id)
      toast({ title: 'User unsuspended', description: 'The user has been unsuspended successfully.' })
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to unsuspend user', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.user) return

    try {
      await deleteMutation.mutateAsync(deleteDialog.user._id)
      toast({ title: 'User deleted', description: 'The user has been deleted successfully.' })
      setDeleteDialog({ open: false, user: null })
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to delete user', variant: 'destructive' })
    }
  }

  const handleResetPassword = async () => {
    if (!resetPasswordDialog.user) return

    try {
      await resetPasswordMutation.mutateAsync(resetPasswordDialog.user._id)
      toast({ title: 'Password reset initiated', description: 'The user will receive an email with reset instructions.' })
      setResetPasswordDialog({ open: false, user: null })
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to reset password', variant: 'destructive' })
    }
  }

  const handleExport = async (user: User) => {
    try {
      await exportMutation.mutateAsync(user._id)
      toast({ title: 'Export complete', description: 'User data has been downloaded.' })
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to export user data', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>

      {/* Premium Stats Cards */}
      <PremiumStatCardGrid columns={4}>
        <PremiumStatCard
          title="Total Users"
          subtitle="All registered accounts"
          value={stats?.total ?? 0}
          change={stats?.totalChange}
          changeLabel="vs last month"
          icon={Users}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={sparklineData.total}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Active Users"
          subtitle="Non-suspended accounts"
          value={stats?.active ?? 0}
          change={stats?.activeChange}
          changeLabel="vs last month"
          icon={UserCheck}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={sparklineData.active}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Suspended"
          subtitle="Blocked accounts"
          value={stats?.suspended ?? 0}
          change={stats?.suspendedChange}
          changeLabel="vs last month"
          icon={UserX}
          iconColor="text-red-500"
          iconBgColor="bg-red-500/10"
          sparklineData={sparklineData.suspended}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="New This Month"
          subtitle="Recent signups"
          value={stats?.newThisMonth ?? 0}
          change={stats?.newThisMonthChange}
          changeLabel="vs last month"
          icon={UserPlus}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
          sparklineData={sparklineData.newThisMonth}
          isLoading={statsLoading}
        />
      </PremiumStatCardGrid>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex gap-2 flex-1 min-w-[250px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>

            {/* Role Filter */}
            <Select value={params.role || 'all'} onValueChange={handleRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Buyer">Buyer</SelectItem>
                <SelectItem value="Seller">Seller</SelectItem>
                <SelectItem value="Seller and Buyer">Seller and Buyer</SelectItem>
              </SelectContent>
            </Select>

            {/* Suspended Filter */}
            <Select value={params.isSuspended === undefined ? 'all' : String(params.isSuspended)} onValueChange={handleSuspendedFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="false">Active</SelectItem>
                <SelectItem value="true">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-destructive">
              Failed to load users
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Company</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.users.map((user) => (
                      <tr
                        key={user._id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/users/${user._id}`)}
                      >
                        <td className="py-3 px-4">{user.mail}</td>
                        <td className="py-3 px-4">
                          <Badge variant={user.displayRole === 'Buyer' ? 'default' : 'secondary'}>
                            {user.displayRole}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {user.company?.companyName || '-'}
                        </td>
                        <td className="py-3 px-4">
                          {user.isSuspended ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/users/${user._id}`)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.isSuspended ? (
                                <DropdownMenuItem onClick={() => handleUnsuspend(user)}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Unsuspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setSuspendDialog({ open: true, user })}>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Suspend
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setResetPasswordDialog({ open: true, user })}>
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExport(user)}>
                                <Download className="mr-2 h-4 w-4" />
                                Export Data
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ open: true, user })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                    {data?.users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((data.page - 1) * data.limit) + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page <= 1}
                      onClick={() => setParams(prev => ({ ...prev, page: prev.page! - 1 }))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.page >= data.totalPages}
                      onClick={() => setParams(prev => ({ ...prev, page: prev.page! + 1 }))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialog.open} onOpenChange={(open) => !open && setSuspendDialog({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend {suspendDialog.user?.mail}? They will not be able to login or access the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Suspension Reason</Label>
              <Textarea
                id="reason"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter the reason for suspension..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={!suspendReason.trim() || suspendMutation.isPending}
            >
              {suspendMutation.isPending ? 'Suspending...' : 'Suspend User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteDialog.user?.mail}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={resetPasswordDialog.open} onOpenChange={(open) => !open && setResetPasswordDialog({ open: false, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a password reset email to {resetPasswordDialog.user?.mail}. They will need to use the OTP to set a new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>
              {resetPasswordMutation.isPending ? 'Sending...' : 'Send Reset Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
