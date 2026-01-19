import { useState } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  Search,
  Plus,
  AlertTriangle,
  Globe,
  Mail,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  useBlockedIPs,
  useBlockIP,
  useUnblockIP,
  useFailedLogins,
  useFailedLoginStats,
} from '../hooks/useSecurity';
import {
  FailedLoginAttempt,
  FailedLoginReason,
  FailedLoginStats,
  BlockIPRequest,
  BlockedIP,
} from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const REASON_LABELS: Record<FailedLoginReason, string> = {
  [FailedLoginReason.INVALID_PASSWORD]: 'Invalid Password',
  [FailedLoginReason.USER_NOT_FOUND]: 'User Not Found',
  [FailedLoginReason.USER_SUSPENDED]: 'User Suspended',
  [FailedLoginReason.OTP_EXPIRED]: 'OTP Expired',
  [FailedLoginReason.OTP_INVALID]: 'Invalid OTP',
  [FailedLoginReason.IP_BLOCKED]: 'IP Blocked',
};

const REASON_COLORS: Record<string, string> = {
  INVALID_PASSWORD: '#ef4444',
  USER_NOT_FOUND: '#f97316',
  USER_SUSPENDED: '#eab308',
  OTP_EXPIRED: '#22c55e',
  OTP_INVALID: '#3b82f6',
  IP_BLOCKED: '#8b5cf6',
};

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export function SecurityPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('blocked-ips');

  // Blocked IPs state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState<BlockIPRequest>({
    ipAddress: '',
    reason: '',
    expiresAt: '',
  });

  // Failed logins state
  const [failedLoginsPage, setFailedLoginsPage] = useState(1);
  const [failedLoginsFilters, setFailedLoginsFilters] = useState({
    email: '',
    ipAddress: '',
    reason: '' as FailedLoginReason | '',
  });

  // Queries
  const { data: blockedIPs = [], isLoading: loadingBlockedIPs, refetch: refetchBlockedIPs } = useBlockedIPs(true);
  const blockIPMutation = useBlockIP();
  const unblockIPMutation = useUnblockIP();

  const { data: failedLoginsData, isLoading: loadingFailedLogins, refetch: refetchFailedLogins } = useFailedLogins({
    page: failedLoginsPage,
    limit: 20,
    email: failedLoginsFilters.email || undefined,
    ipAddress: failedLoginsFilters.ipAddress || undefined,
    reason: failedLoginsFilters.reason || undefined,
  });

  const { data: stats, isLoading: loadingStats } = useFailedLoginStats();

  const handleBlockIP = async () => {
    if (!blockForm.ipAddress || !blockForm.reason) {
      toast({ title: 'Error', description: 'IP address and reason are required', variant: 'destructive' });
      return;
    }

    try {
      await blockIPMutation.mutateAsync({
        ipAddress: blockForm.ipAddress,
        reason: blockForm.reason,
        expiresAt: blockForm.expiresAt || undefined,
      });
      toast({ title: 'Success', description: 'IP address blocked successfully' });
      setShowBlockModal(false);
      setBlockForm({ ipAddress: '', reason: '', expiresAt: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to block IP',
        variant: 'destructive',
      });
    }
  };

  const handleUnblockIP = async (ip: BlockedIP) => {
    try {
      await unblockIPMutation.mutateAsync(ip._id);
      toast({ title: 'Success', description: `IP ${ip.ipAddress} unblocked successfully` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to unblock IP',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getBlockedByName = (blockedBy: BlockedIP['blockedBy']) => {
    if (!blockedBy) return 'System';
    if (typeof blockedBy === 'string') return blockedBy;
    return `${blockedBy.firstName || ''} ${blockedBy.lastName || ''}`.trim() || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Security
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage IP blocks and monitor failed login attempts
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="blocked-ips" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Blocked IPs
          </TabsTrigger>
          <TabsTrigger value="failed-logins" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Failed Logins
          </TabsTrigger>
        </TabsList>

        {/* Blocked IPs Tab */}
        <TabsContent value="blocked-ips" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Blocked IP Addresses</CardTitle>
                  <CardDescription>
                    Manage blocked IP addresses to prevent malicious access
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => refetchBlockedIPs()} disabled={loadingBlockedIPs}>
                    <RefreshCw className={cn('h-4 w-4 mr-2', loadingBlockedIPs && 'animate-spin')} />
                    {loadingBlockedIPs ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Button onClick={() => setShowBlockModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Block IP
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBlockedIPs ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : blockedIPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No blocked IP addresses</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Blocked By</TableHead>
                      <TableHead>Blocked At</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIPs.map((ip: BlockedIP) => (
                      <TableRow key={ip._id}>
                        <TableCell className="font-mono">{ip.ipAddress}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{ip.reason}</TableCell>
                        <TableCell>{getBlockedByName(ip.blockedBy)}</TableCell>
                        <TableCell>{formatDate(ip.blockedAt)}</TableCell>
                        <TableCell>
                          {ip.expiresAt ? formatDate(ip.expiresAt) : (
                            <Badge variant="secondary">Permanent</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ip.isActive ? 'destructive' : 'secondary'}>
                            {ip.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnblockIP(ip)}
                            disabled={unblockIPMutation.isPending}
                          >
                            <Unlock className="h-4 w-4 mr-1" />
                            Unblock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Failed Logins Tab */}
        <TabsContent value="failed-logins" className="space-y-4">
          {/* Stats Cards */}
          {!loadingStats && stats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Last 24 hours</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.topIPs.length}</div>
                  <p className="text-xs text-muted-foreground">Distinct sources</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Emails</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.topEmails.length}</div>
                  <p className="text-xs text-muted-foreground">Targeted accounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Reason</CardTitle>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(stats.byReason[0]?.count ?? 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.byReason[0] ? REASON_LABELS[stats.byReason[0].reason] : 'N/A'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts */}
          {!loadingStats && stats && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Hourly Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hourly Distribution</CardTitle>
                  <CardDescription>Failed login attempts over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => (typeof value === 'string' ? value.split(' ')[1] : value) || value}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) => `Time: ${value}`}
                        formatter={(value) => [
                          typeof value === 'number' ? value : Number(value ?? 0),
                          'Attempts',
                        ]}
                      />
                      <Bar dataKey="count" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* By Reason Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Failure Reasons</CardTitle>
                  <CardDescription>Breakdown by failure type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={stats.byReason}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="reason"
                        label={({ name, percent }) => {
                          const percentValue = typeof percent === 'number' ? percent : 0;
                          const reasonKey = typeof name === 'string' ? name : String(name);
                          const label = REASON_LABELS[reasonKey as FailedLoginReason] || reasonKey;
                          return `${label.slice(0, 10)}: ${(percentValue * 100).toFixed(0)}%`;
                        }}
                        labelLine={false}
                      >
                        {stats.byReason.map(
                          (entry: FailedLoginStats['byReason'][number], index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={REASON_COLORS[entry.reason] || PIE_COLORS[index % PIE_COLORS.length]}
                          />
                          )
                        )}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          typeof value === 'number' ? value : Number(value ?? 0),
                          REASON_LABELS[name as FailedLoginReason] || String(name),
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top IPs and Emails */}
          {!loadingStats && stats && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Offending IPs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.topIPs.slice(0, 5).map((item: FailedLoginStats['topIPs'][number]) => (
                      <div
                        key={item.ipAddress}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm">{item.ipAddress}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {item.uniqueEmails} emails
                          </span>
                          <Badge variant="destructive">{item.count} attempts</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setBlockForm({
                                ipAddress: item.ipAddress,
                                reason: `Suspicious activity: ${item.count} failed login attempts`,
                                expiresAt: '',
                              });
                              setShowBlockModal(true);
                            }}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {stats.topIPs.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Targeted Emails</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.topEmails.slice(0, 5).map((item: FailedLoginStats['topEmails'][number]) => (
                      <div
                        key={item.email}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <span className="text-sm truncate max-w-[200px]">{item.email}</span>
                        <Badge variant="outline">{item.count} attempts</Badge>
                      </div>
                    ))}
                    {stats.topEmails.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Failed Logins Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Failed Login Attempts</CardTitle>
                  <CardDescription>
                    Detailed log of all failed authentication attempts
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchFailedLogins()} disabled={loadingFailedLogins}>
                  <RefreshCw className={cn('h-4 w-4 mr-2', loadingFailedLogins && 'animate-spin')} />
                  {loadingFailedLogins ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label className="sr-only">Email</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email..."
                      value={failedLoginsFilters.email}
                      onChange={(e) => {
                        setFailedLoginsFilters({ ...failedLoginsFilters, email: e.target.value });
                        setFailedLoginsPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-[180px]">
                  <Label className="sr-only">IP Address</Label>
                  <Input
                    placeholder="IP Address..."
                    value={failedLoginsFilters.ipAddress}
                    onChange={(e) => {
                      setFailedLoginsFilters({ ...failedLoginsFilters, ipAddress: e.target.value });
                      setFailedLoginsPage(1);
                    }}
                  />
                </div>
                <div className="w-[180px]">
                  <Select
                    value={failedLoginsFilters.reason || 'all'}
                    onValueChange={(value) => {
                      setFailedLoginsFilters({
                        ...failedLoginsFilters,
                        reason: value === 'all' ? '' : (value as FailedLoginReason),
                      });
                      setFailedLoginsPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Reasons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reasons</SelectItem>
                      {Object.entries(REASON_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(failedLoginsFilters.email || failedLoginsFilters.ipAddress || failedLoginsFilters.reason) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFailedLoginsFilters({ email: '', ipAddress: '', reason: '' });
                      setFailedLoginsPage(1);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Table */}
              {loadingFailedLogins ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !failedLoginsData?.data.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No failed login attempts found</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>User Agent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failedLoginsData.data.map((attempt: FailedLoginAttempt) => (
                        <TableRow key={attempt._id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatDate(attempt.attemptedAt)}
                            </div>
                          </TableCell>
                          <TableCell>{attempt.email}</TableCell>
                          <TableCell className="font-mono">{attempt.ipAddress}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: REASON_COLORS[attempt.reason] || '#6b7280',
                                color: REASON_COLORS[attempt.reason] || '#6b7280',
                              }}
                            >
                              {REASON_LABELS[attempt.reason] || attempt.reason}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                            {attempt.userAgent || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {failedLoginsData.pagination && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing page {failedLoginsData.pagination.page} of{' '}
                        {failedLoginsData.pagination.totalPages} ({failedLoginsData.pagination.total}{' '}
                        total)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFailedLoginsPage((p) => Math.max(1, p - 1))}
                          disabled={failedLoginsPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFailedLoginsPage((p) => p + 1)}
                          disabled={failedLoginsPage >= failedLoginsData.pagination.totalPages}
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
        </TabsContent>
      </Tabs>

      {/* Block IP Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Block IP Address
            </DialogTitle>
            <DialogDescription>
              Add an IP address to the blocklist. Blocked IPs cannot access the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address *</Label>
              <Input
                id="ipAddress"
                placeholder="e.g., 192.168.1.1"
                value={blockForm.ipAddress}
                onChange={(e) => setBlockForm({ ...blockForm, ipAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for blocking this IP..."
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={blockForm.expiresAt}
                onChange={(e) => setBlockForm({ ...blockForm, expiresAt: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Leave empty for a permanent block
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBlockIP}
              disabled={blockIPMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {blockIPMutation.isPending ? 'Blocking...' : 'Block IP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
