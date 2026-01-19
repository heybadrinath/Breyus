import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Shield,
  ShieldOff,
  Users,
  FileText,
  Mail,
  Phone,
  Globe,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Loader2,
  ExternalLink,
  Info,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useCompany, useVerifyCompany, useUnverifyCompany } from '../hooks/useCompanies'
import { KYC_DOCUMENT_TYPE_LABELS, KycDocument } from '../types'

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const { data: company, isLoading, error } = useCompany(id!)
  const verifyCompany = useVerifyCompany()
  const unverifyCompany = useUnverifyCompany()
  const [documentViewer, setDocumentViewer] = useState<{ open: boolean; document: KycDocument | null }>({
    open: false,
    document: null,
  })

  const handleVerify = async () => {
    if (!company) return
    try {
      await verifyCompany.mutateAsync({ id: company._id })
      toast({ title: 'Company verified successfully' })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to verify company',
        variant: 'destructive',
      })
    }
  }

  const handleUnverify = async () => {
    if (!company) return
    try {
      await unverifyCompany.mutateAsync(company._id)
      toast({ title: 'Verification removed' })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to remove verification',
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Company not found</p>
        <Button asChild variant="outline">
          <Link to="/companies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/companies">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{company.companyName}</h1>
            {company.isKycVerified && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{company.role}</p>
        </div>
        <div className="flex gap-2">
          {company.isKycVerified ? (
            <Button
              variant="outline"
              onClick={handleUnverify}
              disabled={unverifyCompany.isPending}
            >
              {unverifyCompany.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldOff className="h-4 w-4 mr-2" />
              )}
              Remove Verification
            </Button>
          ) : (
            <Button onClick={handleVerify} disabled={verifyCompany.isPending}>
              {verifyCompany.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Verify Company
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Founder</p>
                <p className="font-medium">{company.founderName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tax ID</p>
                <p className="font-medium">{company.taxId || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trade Type</p>
                <p className="font-medium capitalize">{company.tradeType || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(company.createdAt)}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              {company.companyAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{company.companyAddress}</span>
                </div>
              )}
              {company.primaryEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{company.primaryEmail}</span>
                </div>
              )}
              {company.companyMobile && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{company.companyMobile}</span>
                </div>
              )}
              {company.websiteUrl && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={company.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {company.websiteUrl}
                  </a>
                </div>
              )}
            </div>

            {company.mainLineBusiness && company.mainLineBusiness.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Business Lines</p>
                  <div className="flex flex-wrap gap-2">
                    {company.mainLineBusiness.map((line, i) => (
                      <Badge key={i} variant="secondary">
                        {line}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{company.stats?.totalTrades || 0}</p>
                <p className="text-sm text-muted-foreground">Total Trades</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{company.stats?.activeTrades || 0}</p>
                <p className="text-sm text-muted-foreground">Active Trades</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{company.stats?.completedTrades || 0}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{company.users?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({company.users?.length || 0})
          </CardTitle>
          <CardDescription>
            <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-blue-700 text-sm">
                Multiple users per company and user role management (Admin, Manager, Viewer) are planned for a future release.
              </span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {company.users && company.users.length > 0 ? (
            <div className="divide-y">
              {company.users.map((user) => (
                <div key={user._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.mail.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.mail}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.isSuspended && (
                      <Badge variant="destructive">Suspended</Badge>
                    )}
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/users/${user._id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          )}
        </CardContent>
      </Card>

      {/* KYC Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            KYC Documents ({company.kycDocuments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.kycDocuments && company.kycDocuments.length > 0 ? (
            <div className="divide-y">
              {company.kycDocuments.map((doc) => (
                <div key={doc._id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.customName}</p>
                        <p className="text-sm text-muted-foreground">
                          {KYC_DOCUMENT_TYPE_LABELS[doc.type] || doc.type} •{' '}
                          {formatFileSize(doc.size)} • Uploaded {formatDate(doc.uploadedAt)}
                        </p>
                        {doc.status === 'rejected' && doc.reviewNotes && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                            <strong>Rejection reason:</strong> {doc.reviewNotes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(doc.status)}
                      <button
                        onClick={() => setDocumentViewer({ open: true, document: doc as KycDocument })}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                        title="View document"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No documents uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Modal */}
      <Dialog open={documentViewer.open} onOpenChange={(open) => !open && setDocumentViewer({ open: false, document: null })}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between pr-8">
              <span>{documentViewer.document?.customName || 'Document Viewer'}</span>
              {documentViewer.document && (
                <div className="flex items-center gap-2">
                  {getStatusBadge(documentViewer.document.status)}
                  <a
                    href={getDocumentUrl(documentViewer.document.path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <a
                    href={getDocumentUrl(documentViewer.document.path)}
                    download={documentViewer.document.customName}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              )}
            </DialogTitle>
            {documentViewer.document && (
              <p className="text-sm text-muted-foreground">
                {KYC_DOCUMENT_TYPE_LABELS[documentViewer.document.type] || documentViewer.document.type} •{' '}
                {formatFileSize(documentViewer.document.size)} • Uploaded {formatDate(documentViewer.document.uploadedAt)}
              </p>
            )}
          </DialogHeader>

          {documentViewer.document && (
            <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-2 min-h-[400px]">
              {documentViewer.document.path.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                <img
                  src={getDocumentUrl(documentViewer.document.path)}
                  alt={documentViewer.document.customName}
                  className="max-w-full h-auto mx-auto rounded"
                />
              ) : documentViewer.document.path.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={getDocumentUrl(documentViewer.document.path)}
                  className="w-full h-full min-h-[500px] rounded"
                  title={documentViewer.document.customName}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                  <FileText className="h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">Preview not available for this file type</p>
                  <Button asChild>
                    <a
                      href={getDocumentUrl(documentViewer.document.path)}
                      download={documentViewer.document.customName}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}

          {documentViewer.document?.status === 'rejected' && documentViewer.document.reviewNotes && (
            <div className="flex-shrink-0 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <strong>Rejection reason:</strong> {documentViewer.document.reviewNotes}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
