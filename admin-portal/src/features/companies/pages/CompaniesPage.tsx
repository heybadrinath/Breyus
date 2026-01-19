import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Search,
  Shield,
  ShieldOff,
  Users,
  FileText,
  MoreHorizontal,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
} from 'lucide-react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { useToast } from '@/hooks/use-toast'
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard'
import { generateMockSparklineData } from '@/components/shared/Sparkline'
import {
  useCompanies,
  useCompanyPageStats,
  useDeleteCompany,
  useVerifyCompany,
  useUnverifyCompany,
} from '../hooks/useCompanies'
import type { Company, CompaniesQueryParams } from '../types'

export function CompaniesPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [params, setParams] = useState<CompaniesQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const { data, isLoading, error } = useCompanies(params)
  const { data: stats, isLoading: statsLoading } = useCompanyPageStats()
  const deleteCompany = useDeleteCompany()
  const verifyCompany = useVerifyCompany()
  const unverifyCompany = useUnverifyCompany()

  // Generate sparkline data for trend visualization
  const sparklineData = useMemo(() => ({
    total: generateMockSparklineData(7, stats?.total ?? 100, 0.08),
    verified: generateMockSparklineData(7, stats?.verified ?? 50, 0.12),
    pending: generateMockSparklineData(7, stats?.pending ?? 20, 0.15),
    newThisMonth: generateMockSparklineData(7, stats?.newThisMonth ?? 10, 0.2),
  }), [stats])

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchInput, page: 1 }))
  }

  const handleFilterChange = (key: keyof CompaniesQueryParams, value: string) => {
    setParams((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1,
    }))
  }

  const handleDelete = async () => {
    if (!selectedCompany) return
    try {
      await deleteCompany.mutateAsync(selectedCompany._id)
      toast({ title: 'Company deleted successfully' })
      setDeleteDialogOpen(false)
      setSelectedCompany(null)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete company',
        variant: 'destructive',
      })
    }
  }

  const handleVerify = async (company: Company) => {
    try {
      await verifyCompany.mutateAsync({ id: company._id })
      toast({ title: `${company.companyName} has been verified` })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to verify company',
        variant: 'destructive',
      })
    }
  }

  const handleUnverify = async (company: Company) => {
    try {
      await unverifyCompany.mutateAsync(company._id)
      toast({ title: `Verification removed from ${company.companyName}` })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to remove verification',
        variant: 'destructive',
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Manage companies and KYC verification</p>
        </div>
      </div>

      {/* Premium Stats Cards */}
      <PremiumStatCardGrid columns={4}>
        <PremiumStatCard
          title="Total Companies"
          subtitle="All registered businesses"
          value={stats?.total ?? 0}
          change={stats?.totalChange}
          changeLabel="vs last month"
          icon={Building2}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
          sparklineData={sparklineData.total}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="KYC Verified"
          subtitle="Completed verification"
          value={stats?.verified ?? 0}
          change={stats?.verifiedChange}
          changeLabel="vs last month"
          icon={Shield}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={sparklineData.verified}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Pending KYC"
          subtitle="Awaiting review"
          value={stats?.pending ?? 0}
          change={stats?.pendingChange}
          changeLabel="vs last month"
          icon={Clock}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
          sparklineData={sparklineData.pending}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="New This Month"
          subtitle="Recent registrations"
          value={stats?.newThisMonth ?? 0}
          change={stats?.newThisMonthChange}
          changeLabel="vs last month"
          icon={Plus}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          sparklineData={sparklineData.newThisMonth}
          isLoading={statsLoading}
        />
      </PremiumStatCardGrid>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
        </div>

        <Select
          value={params.role || 'all'}
          onValueChange={(value) => handleFilterChange('role', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Buyer">Buyer</SelectItem>
            <SelectItem value="Seller">Seller</SelectItem>
            <SelectItem value="Seller and Buyer">Both</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={params.isKycVerified === true ? 'verified' : params.isKycVerified === false ? 'unverified' : 'all'}
          onValueChange={(value) =>
            handleFilterChange(
              'isKycVerified',
              value === 'verified' ? 'true' : value === 'unverified' ? 'false' : 'all'
            )
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="KYC Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Failed to load companies
                </TableCell>
              </TableRow>
            ) : data?.companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              data?.companies.map((company) => (
                <TableRow
                  key={company._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/companies/${company._id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Link
                          to={`/companies/${company._id}`}
                          className="font-medium hover:underline"
                        >
                          {company.companyName}
                        </Link>
                        {company.primaryEmail && (
                          <p className="text-sm text-muted-foreground">
                            {company.primaryEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{company.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {company.isKycVerified ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <ShieldOff className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {company.userCount || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{company.documentCount || 0}</span>
                      {(company.pendingDocumentCount || 0) > 0 && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                          {company.pendingDocumentCount} pending
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(company.createdAt)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/companies/${company._id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {company.isKycVerified ? (
                          <DropdownMenuItem onClick={() => handleUnverify(company)}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Remove Verification
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleVerify(company)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Verify Company
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedCompany(company)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.page - 1) * data.limit + 1} to{' '}
            {Math.min(data.page * data.limit, data.total)} of {data.total} companies
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page === 1}
              onClick={() => setParams((prev) => ({ ...prev, page: prev.page! - 1 }))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page === data.totalPages}
              onClick={() => setParams((prev) => ({ ...prev, page: prev.page! + 1 }))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{selectedCompany?.companyName}</strong>? This will also delete all
              users belonging to this company. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCompany.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
