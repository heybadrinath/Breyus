import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertCircle,
  FileStack,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { PremiumStatCard, PremiumStatCardGrid } from '@/components/shared/PremiumStatCard'
import { generateMockSparklineData } from '@/components/shared/Sparkline'
import {
  useKycDocuments,
  useKycStats,
  useApproveDocument,
  useRejectDocument,
} from '../hooks/useKyc'
import type { KycDocumentsQueryParams, KycDocumentWithCompany } from '../types'
import { KYC_DOCUMENT_TYPE_LABELS } from '../types'

export function KycQueuePage() {
  const { toast } = useToast()
  const [params, setParams] = useState<KycDocumentsQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = useState('')
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean
    type: 'approve' | 'reject'
    document: KycDocumentWithCompany | null
  }>({ open: false, type: 'approve', document: null })
  const [reviewNotes, setReviewNotes] = useState('')

  const { data, isLoading, error } = useKycDocuments(params)
  const { data: stats, isLoading: statsLoading } = useKycStats()
  const approveDocument = useApproveDocument()
  const rejectDocument = useRejectDocument()

  // Generate sparkline data for trend visualization
  const sparklineData = useMemo(() => ({
    total: generateMockSparklineData(7, stats?.totalDocuments ?? 50, 0.1),
    pending: generateMockSparklineData(7, stats?.pendingDocuments ?? 10, 0.25),
    verified: generateMockSparklineData(7, stats?.verifiedCompanies ?? 30, 0.12),
    unverified: generateMockSparklineData(7, stats?.unverifiedCompanies ?? 20, 0.15),
  }), [stats])

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchInput, page: 1 }))
  }

  const handleFilterChange = (key: keyof KycDocumentsQueryParams, value: string) => {
    setParams((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1,
    }))
  }

  const openReviewDialog = (type: 'approve' | 'reject', doc: KycDocumentWithCompany) => {
    setReviewDialog({ open: true, type, document: doc })
    setReviewNotes('')
  }

  const handleReview = async () => {
    if (!reviewDialog.document) {
      console.error('KYC Review: No document in dialog state')
      return
    }

    const { type, document } = reviewDialog
    const { company } = document

    // Debug logging
    console.log('KYC Review: Starting', { type, companyId: company._id, documentId: document.document._id })

    try {
      if (type === 'approve') {
        await approveDocument.mutateAsync({
          companyId: company._id,
          documentId: document.document._id,
          notes: reviewNotes,
        })
        toast({ title: 'Document approved successfully' })
      } else {
        if (reviewNotes.length < 10) {
          toast({
            title: 'Error',
            description: 'Please provide a reason for rejection (at least 10 characters)',
            variant: 'destructive',
          })
          return
        }
        await rejectDocument.mutateAsync({
          companyId: company._id,
          documentId: document.document._id,
          notes: reviewNotes,
        })
        toast({ title: 'Document rejected' })
      }
      setReviewDialog({ open: false, type: 'approve', document: null })
    } catch (err: any) {
      console.error('KYC Review Error:', err)
      // Extract error message from axios error response
      const errorMessage = err.response?.data?.message || err.message || `Failed to ${type} document`
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDocumentUrl = (path: string) => {
    if (path.startsWith('http')) return path
    return `${import.meta.env.VITE_API_URL || ''}${path.startsWith('/') ? '' : '/'}${path}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KYC Document Review</h1>
        <p className="text-muted-foreground">Review and approve company verification documents</p>
      </div>

      {/* Premium Stats Cards */}
      <PremiumStatCardGrid columns={4}>
        <PremiumStatCard
          title="Total Documents"
          subtitle="All uploaded files"
          value={stats?.totalDocuments ?? 0}
          icon={FileStack}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
          sparklineData={sparklineData.total}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Pending Review"
          subtitle="Awaiting verification"
          value={stats?.pendingDocuments ?? 0}
          icon={Clock}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
          sparklineData={sparklineData.pending}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Verified Companies"
          subtitle="KYC approved"
          value={stats?.verifiedCompanies ?? 0}
          icon={Shield}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          sparklineData={sparklineData.verified}
          isLoading={statsLoading}
        />
        <PremiumStatCard
          title="Unverified"
          subtitle="Pending verification"
          value={stats?.unverifiedCompanies ?? 0}
          icon={AlertCircle}
          iconColor="text-gray-500"
          iconBgColor="bg-gray-500/10"
          sparklineData={sparklineData.unverified}
          isLoading={statsLoading}
        />
      </PremiumStatCardGrid>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
        </div>

        <Select
          value={params.status || 'all'}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={params.documentType || 'all'}
          onValueChange={(value) => handleFilterChange('documentType', value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="cis">CIS</SelectItem>
            <SelectItem value="passport">Passport</SelectItem>
            <SelectItem value="tax_certificate">Tax Certificate</SelectItem>
            <SelectItem value="business_registration">Business Registration</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Document Stats */}
      {data?.stats && (
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            Total: <strong>{data.total}</strong>
          </span>
          {data.stats.pending > 0 && (
            <span className="text-yellow-600">
              Pending: <strong>{data.stats.pending}</strong>
            </span>
          )}
          {data.stats.approved > 0 && (
            <span className="text-green-600">
              Approved: <strong>{data.stats.approved}</strong>
            </span>
          )}
          {data.stats.rejected > 0 && (
            <span className="text-red-600">
              Rejected: <strong>{data.stats.rejected}</strong>
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Failed to load documents
                </TableCell>
              </TableRow>
            ) : data?.documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              data?.documents.map((item) => (
                <TableRow key={`${item.company._id}-${item.document._id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{item.document.customName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(item.document.size)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/companies/${item.company._id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {item.company.companyName}
                      {item.company.isKycVerified && (
                        <Shield className="h-3 w-3 text-green-500" />
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {KYC_DOCUMENT_TYPE_LABELS[item.document.type] || item.document.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.document.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(item.document.uploadedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <a
                        href={getDocumentUrl(item.document.path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                        title="View document"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      {item.document.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => openReviewDialog('approve', item)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openReviewDialog('reject', item)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
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
            {Math.min(data.page * data.limit, data.total)} of {data.total} documents
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

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => !open && setReviewDialog({ open: false, type: 'approve', document: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.type === 'approve' ? 'Approve Document' : 'Reject Document'}
            </DialogTitle>
            <DialogDescription>
              {reviewDialog.type === 'approve'
                ? 'Add optional notes for the approval.'
                : 'Please provide a reason for rejection. This will be visible to the user.'}
            </DialogDescription>
          </DialogHeader>
          {reviewDialog.document && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{reviewDialog.document.document.customName}</p>
                <p className="text-sm text-muted-foreground">
                  {reviewDialog.document.company.companyName} •{' '}
                  {KYC_DOCUMENT_TYPE_LABELS[reviewDialog.document.document.type]}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {reviewDialog.type === 'approve' ? 'Notes (optional)' : 'Rejection Reason'}
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewDialog.type === 'approve'
                      ? 'Add notes about this approval...'
                      : 'Explain why this document was rejected...'
                  }
                  className="mt-1"
                  rows={3}
                />
                {reviewDialog.type === 'reject' && reviewNotes.length < 10 && (
                  <p className="text-sm text-red-500 mt-1">
                    Please provide at least 10 characters
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialog({ open: false, type: 'approve', document: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={
                (reviewDialog.type === 'reject' && reviewNotes.length < 10) ||
                approveDocument.isPending ||
                rejectDocument.isPending
              }
              className={
                reviewDialog.type === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {(approveDocument.isPending || rejectDocument.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {reviewDialog.type === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
