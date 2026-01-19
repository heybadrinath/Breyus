import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserX, UserCheck, Key, Download, Trash2, Building, Mail, Calendar, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import { useUser, useSuspendUser, useUnsuspendUser, useDeleteUser, useForcePasswordReset, useExportUserData } from '../hooks/useUsers'

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Dialog states
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)

  // Queries and mutations
  const { data, isLoading, error } = useUser(id!)
  const suspendMutation = useSuspendUser()
  const unsuspendMutation = useUnsuspendUser()
  const deleteMutation = useDeleteUser()
  const resetPasswordMutation = useForcePasswordReset()
  const exportMutation = useExportUserData()

  const user = data?.user
  const stats = data?.stats

  const handleSuspend = async () => {
    if (!user || !suspendReason.trim()) return

    try {
      await suspendMutation.mutateAsync({
        userId: user._id,
        data: { reason: suspendReason },
      })
      toast({ title: 'User suspended', description: 'The user has been suspended successfully.' })
      setSuspendDialogOpen(false)
      setSuspendReason('')
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to suspend user', variant: 'destructive' })
    }
  }

  const handleUnsuspend = async () => {
    if (!user) return

    try {
      await unsuspendMutation.mutateAsync(user._id)
      toast({ title: 'User unsuspended', description: 'The user has been unsuspended successfully.' })
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to unsuspend user', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!user) return

    try {
      await deleteMutation.mutateAsync(user._id)
      toast({ title: 'User deleted', description: 'The user has been deleted successfully.' })
      navigate('/users')
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to delete user', variant: 'destructive' })
    }
  }

  const handleResetPassword = async () => {
    if (!user) return

    try {
      await resetPasswordMutation.mutateAsync(user._id)
      toast({ title: 'Password reset initiated', description: 'The user will receive an email with reset instructions.' })
      setResetPasswordDialogOpen(false)
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to reset password', variant: 'destructive' })
    }
  }

  const handleExport = async () => {
    if (!user) return

    try {
      await exportMutation.mutateAsync(user._id)
      toast({ title: 'Export complete', description: 'User data has been downloaded.' })
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to export user data', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">Failed to load user</p>
        <Button variant="outline" onClick={() => navigate('/users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/users')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{user.mail}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={user.displayRole === 'Buyer' ? 'default' : 'secondary'}>
                {user.displayRole}
              </Badge>
              {user.isSuspended ? (
                <Badge variant="destructive">Suspended</Badge>
              ) : (
                <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {user.isSuspended ? (
            <Button variant="outline" onClick={handleUnsuspend} disabled={unsuspendMutation.isPending}>
              <UserCheck className="mr-2 h-4 w-4" />
              Unsuspend
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setSuspendDialogOpen(true)}>
              <UserX className="mr-2 h-4 w-4" />
              Suspend
            </Button>
          )}
          <Button variant="outline" onClick={() => setResetPasswordDialogOpen(true)}>
            <Key className="mr-2 h-4 w-4" />
            Reset Password
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Suspension Alert */}
      {user.isSuspended && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <UserX className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-medium text-destructive">Account Suspended</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>Reason:</strong> {user.suspensionReason || 'No reason provided'}
                </p>
                {user.suspendedAt && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Suspended on:</strong> {new Date(user.suspendedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.mail}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium">{user.displayRole}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Account Created</p>
                <p className="font-medium">{new Date(user.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {user.company && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{user.company.companyName}</p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm"
                      onClick={() => navigate(`/companies/${user.company?._id}`)}
                    >
                      View Company
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Trades</span>
              <span className="font-semibold text-lg">{stats?.totalTrades || 0}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Active Trades</span>
              <span className="font-semibold text-lg text-blue-600">{stats?.activeTrades || 0}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Completed Trades</span>
              <span className="font-semibold text-lg text-green-600">{stats?.completedTrades || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend {user.mail}? They will not be able to login or access the platform.
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
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {user.mail}? This action cannot be undone.
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
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a password reset email to {user.mail}. They will need to use the OTP to set a new password.
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
