import { useState } from 'react';
import {
  Mail,
  Plus,
  Trash2,
  MoreHorizontal,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Link as LinkIcon,
  Calendar,
  User,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard';
import { generateMockSparklineData } from '@/components/shared/Sparkline';
import { useToast } from '@/hooks/use-toast';
import {
  useWriterInvites,
  useCreateWriterInvite,
  useRevokeWriterInvite,
} from '../hooks/useBlogs';
import type { WriterInvite } from '../types';

/**
 * InvitesPage - Admin page for managing writer invites
 *
 * Features:
 * - KPI stats (total invites, pending, used, expired)
 * - Generate new invite with optional email hint and admin note
 * - Table with invite details
 * - Actions: Copy link, Revoke invite
 */
export function InvitesPage() {
  const { toast } = useToast();

  // Dialog states
  const [createDialog, setCreateDialog] = useState(false);
  const [newInvite, setNewInvite] = useState({
    emailHint: '',
    adminNote: '',
  });
  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean;
    invite: WriterInvite | null;
  }>({ open: false, invite: null });

  // Queries
  const { data: invites, isLoading, error } = useWriterInvites();

  // Mutations
  const createMutation = useCreateWriterInvite();
  const revokeMutation = useRevokeWriterInvite();

  // Calculate stats
  const totalInvites = invites?.length || 0;
  const pendingInvites = invites?.filter(
    (i) => !i.usedBy && new Date(i.expiresAt) > new Date()
  ).length || 0;
  const usedInvites = invites?.filter((i) => i.usedBy).length || 0;
  const expiredInvites = invites?.filter(
    (i) => !i.usedBy && new Date(i.expiresAt) <= new Date()
  ).length || 0;

  // Handlers
  const handleCreate = async () => {
    try {
      const result = await createMutation.mutateAsync({
        emailHint: newInvite.emailHint || undefined,
        adminNote: newInvite.adminNote || undefined,
      });

      // Copy link to clipboard
      const inviteLink = `${window.location.origin}/blog/invite/${result.data?.token}`;
      await navigator.clipboard.writeText(inviteLink);

      toast({
        title: 'Invite created',
        description: 'The invite link has been copied to your clipboard.',
      });
      setCreateDialog(false);
      setNewInvite({ emailHint: '', adminNote: '' });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to create invite',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = async (token: string) => {
    const inviteLink = `${window.location.origin}/blog/invite/${token}`;
    await navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Copied',
      description: 'Invite link copied to clipboard.',
    });
  };

  const handleRevoke = async () => {
    if (!revokeDialog.invite) return;

    try {
      await revokeMutation.mutateAsync(revokeDialog.invite._id);
      toast({
        title: 'Invite revoked',
        description: 'The invite link is no longer valid.',
      });
      setRevokeDialog({ open: false, invite: null });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to revoke invite',
        variant: 'destructive',
      });
    }
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

  const getInviteStatus = (invite: WriterInvite) => {
    if (invite.usedBy) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Used
        </Badge>
      );
    }
    if (new Date(invite.expiresAt) <= new Date()) {
      return (
        <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const isExpiredOrUsed = (invite: WriterInvite) => {
    return invite.usedBy || new Date(invite.expiresAt) <= new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Writer Invites</h1>
          <p className="text-muted-foreground">
            Generate and manage invite links for new writers
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Invite
        </Button>
      </div>

      {/* Stats Cards */}
      <PremiumStatCardGrid columns={4}>
        <PremiumStatCard
          title="Total Invites"
          subtitle="All time"
          value={totalInvites}
          icon={Mail}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={generateMockSparklineData(7, totalInvites, 0.1)}
          isLoading={isLoading}
        />
        <PremiumStatCard
          title="Pending"
          subtitle="Awaiting use"
          value={pendingInvites}
          icon={Clock}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
          sparklineData={generateMockSparklineData(7, pendingInvites, 0.2)}
          isLoading={isLoading}
        />
        <PremiumStatCard
          title="Used"
          subtitle="Successfully claimed"
          value={usedInvites}
          icon={CheckCircle}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={generateMockSparklineData(7, usedInvites, 0.15)}
          isLoading={isLoading}
        />
        <PremiumStatCard
          title="Expired"
          subtitle="No longer valid"
          value={expiredInvites}
          icon={XCircle}
          iconColor="text-gray-500"
          iconBgColor="bg-gray-500/10"
          sparklineData={generateMockSparklineData(7, expiredInvites, 0.3)}
          isLoading={isLoading}
        />
      </PremiumStatCardGrid>

      {/* Info Card */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <LinkIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium">How Writer Invites Work</h3>
              <p className="text-sm text-muted-foreground mt-1">
                When you generate an invite, a unique link is created that expires in 7 days.
                Share this link with the person you want to invite as a writer. They can use
                the link to sign up or log in, and their account will automatically be granted
                writer privileges.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invites
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-destructive">
              Failed to load invites
            </div>
          ) : !invites?.length ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No invites yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate an invite to start adding writers.
              </p>
              <Button onClick={() => setCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Invite
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invite Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email Hint</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Used By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite._id}>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {invite.token.substring(0, 12)}...
                      </code>
                    </TableCell>
                    <TableCell>{getInviteStatus(invite)}</TableCell>
                    <TableCell>
                      {invite.emailHint ? (
                        <span className="text-sm">{invite.emailHint}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {invite.createdBy.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invite.usedBy ? (
                        <div className="text-sm">
                          <div>{invite.usedBy.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(invite.usedAt!)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4" />
                        {formatDate(invite.expiresAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!isExpiredOrUsed(invite) && (
                            <DropdownMenuItem
                              onClick={() => handleCopyLink(invite.token)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                          )}
                          {invite.adminNote && (
                            <DropdownMenuItem disabled>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {invite.adminNote.substring(0, 30)}...
                            </DropdownMenuItem>
                          )}
                          {!isExpiredOrUsed(invite) && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                setRevokeDialog({ open: true, invite })
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Revoke
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Invite Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Writer Invite</DialogTitle>
            <DialogDescription>
              Create a new invite link that will expire in 7 days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-hint">Email Hint (Optional)</Label>
              <Input
                id="email-hint"
                placeholder="john@example.com"
                value={newInvite.emailHint}
                onChange={(e) =>
                  setNewInvite((prev) => ({ ...prev, emailHint: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                For your reference only. The invite can be used by anyone.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-note">Admin Note (Optional)</Label>
              <Textarea
                id="admin-note"
                placeholder="Add a note about this invite..."
                value={newInvite.adminNote}
                onChange={(e) =>
                  setNewInvite((prev) => ({ ...prev, adminNote: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate & Copy Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Invite Dialog */}
      <AlertDialog
        open={revokeDialog.open}
        onOpenChange={(open) =>
          !open && setRevokeDialog({ open: false, invite: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invite</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this invite? The link will no longer
              work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke Invite'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
