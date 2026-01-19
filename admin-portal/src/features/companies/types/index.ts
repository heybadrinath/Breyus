export interface Company {
  _id: string
  companyName: string
  companyAddress?: string
  companyMobile?: string
  taxId?: string
  founderName?: string
  websiteUrl?: string
  role: 'Buyer' | 'Seller' | 'Seller and Buyer'
  tradeType?: 'international' | 'domestic'
  mainLineBusiness?: string[]
  isVerified?: boolean
  isKycVerified?: boolean
  kycVerifiedBy?: string
  kycVerifiedAt?: string
  kycVerificationNotes?: string
  kycDocuments?: KycDocument[]
  whatsappContact?: string
  primaryEmail?: string
  alternativeSalesEmail?: string
  createdAt: string
  updatedAt: string
  // Added by service
  userCount?: number
  documentCount?: number
  pendingDocumentCount?: number
}

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

export interface CompanyUser {
  _id: string
  mail: string
  role: string
  isSuspended?: boolean
  createdAt: string
}

export interface CompanyStats {
  totalTrades: number
  activeTrades: number
  completedTrades: number
  userCount: number
}

export interface CompanyDetail extends Company {
  users: CompanyUser[]
  stats: CompanyStats
}

export interface CompaniesQueryParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  isKycVerified?: boolean
  hasKycDocuments?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedCompaniesResponse {
  companies: Company[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const KYC_DOCUMENT_TYPE_LABELS: Record<KycDocument['type'], string> = {
  cis: 'CIS (Customer Information Sheet)',
  passport: 'Passport',
  tax_certificate: 'Tax Certificate',
  business_registration: 'Business Registration',
  other: 'Other',
}

// Stats for the companies list page KPI cards
export interface CompanyPageStats {
  total: number
  verified: number
  pending: number
  newThisMonth: number
  totalChange?: number
  verifiedChange?: number
  pendingChange?: number
  newThisMonthChange?: number
}
