export interface KycDocument {
  _id: string
  type: 'cis' | 'passport' | 'tax_certificate' | 'business_registration' | 'other'
  customName: string
  filename: string
  originalName: string
  path: string
  mimeType: string
  size: number
  status: 'pending' | 'approved' | 'rejected'
  uploadedAt: string
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
}

export interface KycDocumentWithCompany {
  document: KycDocument
  company: {
    _id: string
    companyName: string
    role: string
    isKycVerified: boolean
  }
}

export interface KycDocumentsQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: 'pending' | 'approved' | 'rejected'
  documentType?: KycDocument['type']
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedKycDocumentsResponse {
  documents: KycDocumentWithCompany[]
  total: number
  page: number
  limit: number
  totalPages: number
  stats: {
    pending: number
    approved: number
    rejected: number
  }
}

export interface KycStats {
  pendingDocuments: number
  verifiedCompanies: number
  unverifiedCompanies: number
  totalDocuments: number
}

export const KYC_DOCUMENT_TYPE_LABELS: Record<KycDocument['type'], string> = {
  cis: 'CIS (Customer Information Sheet)',
  passport: 'Passport',
  tax_certificate: 'Tax Certificate',
  business_registration: 'Business Registration',
  other: 'Other',
}

export const KYC_STATUS_LABELS: Record<KycDocument['status'], string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
}
