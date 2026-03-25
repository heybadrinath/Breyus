import { useState } from 'react';
import {
  Mail,
  Search,
  Download,
  Send,
  UserX,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Users,
  TrendingUp,
  UserMinus,
  MailX,
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
  useNewsletterSubscribers,
  useNewsletterStats,
  useUnsubscribeUser,
  useExportSubscribers,
  useSendDigestNow,
} from '../hooks/useBlogs';
import type { NewsletterSubscriberQueryParams, NewsletterSubscriber } from '../types';

/**
 * SubscribersPage - Admin page for managing newsletter subscribers
 *
 * Features:
 * - KPI stats (total, active, inactive, unsubscribed this week, growth rate)
 * - Search and filter subscribers
 * - Table with subscriber details
 * - Actions: Export CSV, Send Digest, Unsubscribe
 */
export function SubscribersPage() {
  const { toast } = useToast();

  // State
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<NewsletterSubscriberQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'subscribedAt',
    sortOrder: 'desc',
  });

  // Dialog states
  const [unsubscribeDialog, setUnsubscribeDialog] = useState<{
    open: boolean;
    subscriber: NewsletterSubscriber | null;
  }>({ open: false, subscriber: null });

  const [digestDialog, setDigestDialog] = useState(false);

  // Queries
  const { data: subscribersData, isLoading, error } = useNewsletterSubscribers(filters);
  const { data: stats, isLoading: statsLoading } = useNewsletterStats();

  // Mutations
  const unsubscribeMutation = useUnsubscribeUser();
  const exportMutation = useExportSubscribers();
  const digestMutation = useSendDigestNow();

  // Handlers
  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput || undefined,
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof NewsletterSubscriberQueryParams, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value === 'true' ? true : value === 'false' ? false : value,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ page: 1, limit: 20, sortBy: 'subscribedAt', sortOrder: 'desc' });
  };

  const handleUnsubscribe = async () => {
    if (!unsubscribeDialog.subscriber) return;

    try {
      await unsubscribeMutation.mutateAsync(unsubscribeDialog.subscriber._id);
      toast({
        title: 'User unsubscribed',
        description: `${unsubscribeDialog.subscriber.email} has been unsubscribed from the newsletter.`,
      });
      setUnsubscribeDialog({ open: false, subscriber: null });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to unsubscribe user',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync();
      toast({
        title: 'Export started',
        description: 'CSV file is downloading.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to export subscribers',
        variant: 'destructive',
      });
    }
  };

  const handleSendDigest = async () => {
    try {
      const result = await digestMutation.mutateAsync();
      const data = (result as any)?.data;
      toast({
        title: 'Digest sent successfully!',
        description: `Sent to ${data?.sent || 0} subscribers (${data?.posts || 0} articles). ${data?.failed ? `${data.failed} failed.` : ''}`,
      });
      setDigestDialog(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to send digest',
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

  const getSourceBadge = (source: string) => {
    const styles: Record<string, { bg: string; text: string; border: string; label: string }> = {
      blog_footer: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', label: 'Footer' },
      blog_homepage: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20', label: 'Homepage' },
      blog_post: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/20', label: 'Post' },
      blog_settings: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', label: 'Settings' },
    };
    const fallback = { bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-500/20', label: source || 'Unknown' };
    const style = styles[source] || fallback;
    return (
      <Badge className={`${style.bg} ${style.text} ${style.border}`}>
        {style.label}
      </Badge>
    );
  };

  const hasActiveFilters =
    filters.search ||
    filters.isActive !== undefined ||
    filters.source !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletter Subscribers</h1>
          <p className="text-muted-foreground">
            Manage newsletter subscriptions and send digests
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button onClick={() => setDigestDialog(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Digest Now
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <PremiumStatCardGrid columns={3}>
        <PremiumStatCard
          title="Total Subscribers"
          subtitle="All time"
          value={stats?.totalSubscribers || 0}
          icon={Mail}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={generateMockSparklineData(7, stats?.totalSubscribers || 0, 0.1)}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Active"
          subtitle="Receiving emails"
          value={stats?.activeSubscribers || 0}
          icon={Users}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={generateMockSparklineData(7, stats?.activeSubscribers || 0, 0.12)}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Inactive"
          subtitle="Unsubscribed"
          value={stats?.inactiveSubscribers || 0}
          icon={UserMinus}
          iconColor="text-gray-500"
          iconBgColor="bg-gray-500/10"
          sparklineData={generateMockSparklineData(7, stats?.inactiveSubscribers || 0, 0.05)}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="New This Week"
          subtitle="Last 7 days"
          value={stats?.newThisWeek || 0}
          icon={MailX}
          iconColor="text-[#B8860B]"
          iconBgColor="bg-[#B8860B]/10"
          sparklineData={generateMockSparklineData(7, stats?.newThisWeek || 0, 0.2)}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Growth Rate"
          subtitle="Weekly change"
          value={stats?.growthRate || 0}
          formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
          icon={TrendingUp}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={generateMockSparklineData(7, stats?.growthRate || 0, 0.3)}
          isLoading={statsLoading}
        />
        {stats?.sourceBreakdown && stats.sourceBreakdown.length > 0 && (
          <PremiumStatCard
            title="Top Source"
            subtitle={stats.sourceBreakdown[0]?.source.replace('blog_', '') || 'N/A'}
            value={stats.sourceBreakdown[0]?.count || 0}
            icon={TrendingUp}
            iconColor="text-purple-500"
            iconBgColor="bg-purple-500/10"
            sparklineData={generateMockSparklineData(7, stats.sourceBreakdown[0]?.count || 0, 0.15)}
            isLoading={statsLoading}
          />
        )}
      </PremiumStatCardGrid>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-md">
              <Input
                placeholder="Search by email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button variant="secondary" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>

            {/* Filter: Status */}
            <Select
              value={
                filters.isActive === undefined
                  ? 'all'
                  : String(filters.isActive)
              }
              onValueChange={(v) => handleFilterChange('isActive', v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter: Source */}
            <Select
              value={filters.source || 'all'}
              onValueChange={(v) => handleFilterChange('source', v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="blog_footer">Footer</SelectItem>
                <SelectItem value="blog_homepage">Homepage</SelectItem>
                <SelectItem value="blog_post">Post</SelectItem>
                <SelectItem value="blog_settings">Settings</SelectItem>
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

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Subscribers
            {subscribersData?.total !== undefined && (
              <Badge variant="secondary" className="ml-2">
                {subscribersData.total}
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
              Failed to load subscribers
            </div>
          ) : !subscribersData?.subscribers?.length ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No subscribers found</h3>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'No newsletter subscribers yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Digest</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribersData.subscribers.map((subscriber) => (
                    <TableRow key={subscriber._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{subscriber.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(subscriber.subscribedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSourceBadge(subscriber.source)}
                      </TableCell>
                      <TableCell>
                        {subscriber.isActive ? (
                          <Badge
                            variant="outline"
                            className="bg-green-500/10 text-green-600 border-green-500/20"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {subscriber.lastDigestSentAt
                          ? formatDate(subscriber.lastDigestSentAt)
                          : <span className="text-muted-foreground/60">Never</span>
                        }
                      </TableCell>
                      <TableCell>
                        {subscriber.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setUnsubscribeDialog({ open: true, subscriber })
                            }
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Unsubscribe
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {subscribersData.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {subscribersData.page} of {subscribersData.pages} ({subscribersData.total}{' '}
                    subscribers)
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
                      disabled={subscribersData.page >= subscribersData.pages}
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

      {/* Unsubscribe Dialog */}
      <AlertDialog
        open={unsubscribeDialog.open}
        onOpenChange={(open) =>
          !open && setUnsubscribeDialog({ open: false, subscriber: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsubscribe User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unsubscribe{' '}
              <strong>{unsubscribeDialog.subscriber?.email}</strong>? They will no
              longer receive the weekly digest email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnsubscribe}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unsubscribeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unsubscribing...
                </>
              ) : (
                'Unsubscribe'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Digest Confirmation Dialog */}
      <AlertDialog
        open={digestDialog}
        onOpenChange={(open) => {
          // Prevent closing while sending
          if (!digestMutation.isPending) {
            setDigestDialog(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Weekly Digest</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will send the weekly digest email to all active subscribers with
                  articles published in the last 7 days.
                </p>
                {stats?.activeSubscribers !== undefined && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Will be sent to <strong>{stats.activeSubscribers}</strong> active subscribers
                    </span>
                  </div>
                )}
                {digestMutation.isPending && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      Sending emails... This may take a moment for large subscriber lists.
                    </span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={digestMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendDigest}
              disabled={digestMutation.isPending}
            >
              {digestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Digest
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default SubscribersPage;
