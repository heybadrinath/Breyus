export interface Product {
  _id: string
  name: string
  price: string
  currency: string
  productImages?: string[]
}

export interface UserRef {
  _id: string
  mail: string
  company?: {
    _id: string
    companyName: string
  }
}

export interface AdminNote {
  _id: string
  content: string
  addedBy: string
  addedByEmail: string
  addedAt: string
}

export interface DisputeRef {
  _id: string
  status: string
  priority: string
}

export interface Trade {
  _id: string
  product: Product
  buyer: UserRef
  seller: UserRef
  quantity: string
  quantityUnit: string
  buyerOfferedPrice?: string
  sellerOfferedPrice?: string
  negotiationStatus: 'pending' | 'countered' | 'buyer_responded' | 'accepted' | 'rejected' | 'cancelled'
  tradePhase: 'PR' | 'SCO' | 'ICPO' | 'SPA' | 'PAYMENT' | 'BOL' | 'COMPLETED' | 'CANCELLED'
  currentNegotiationRound: number
  negotiationHistory: NegotiationEntry[]
  adminNotes: AdminNote[]
  lastPhaseChangeAt?: string
  activeDispute?: DisputeRef
  isStalled?: boolean
  daysSincePhaseChange?: number
  createdAt: string
  updatedAt: string
}

export interface NegotiationEntry {
  round: number
  party: 'buyer' | 'seller'
  offeredPrice?: string
  message?: string
  timestamp: string
}

export interface TradesQueryParams {
  page?: number
  limit?: number
  search?: string
  negotiationStatus?: string
  tradePhase?: string
  buyerId?: string
  sellerId?: string
  isStalled?: boolean
  hasDispute?: boolean
  dateFrom?: string
  dateTo?: string
  minValue?: number
  maxValue?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'lastPhaseChangeAt'
  sortOrder?: 'asc' | 'desc'
  stalledDays?: number
}

export interface PaginatedTradesResponse {
  trades: Trade[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface TradeStats {
  totalTrades: number
  activeTrades: number
  completedTrades: number
  cancelledTrades: number
  stalledTrades: number
  disputedTrades: number
  byPhase: Record<string, number>
  byNegotiationStatus: Record<string, number>
}

export interface StalledTradesResponse {
  trades: Trade[]
  total: number
  threshold: number
}

export interface TradeTimelineEvent {
  type: string
  description: string
  timestamp: string
  actor?: string
  actorType?: 'buyer' | 'seller' | 'admin' | 'system'
  metadata?: Record<string, any>
}

export interface AddTradeNoteDto {
  content: string
}

// ========================
// Document Verification
// ========================

export const VERIFIABLE_DOCUMENT_TYPES = [
  'sco',
  'icpo',
  'spa',
  'bol',
  'payment-proof',
] as const

export type VerifiableDocumentType = (typeof VERIFIABLE_DOCUMENT_TYPES)[number]

export const DOCUMENT_TYPE_LABELS: Record<VerifiableDocumentType, { label: string; uploadedBy: string }> = {
  sco: { label: 'SCO (Soft Corporate Offer)', uploadedBy: 'Seller' },
  icpo: { label: 'ICPO (Purchase Order)', uploadedBy: 'Buyer' },
  spa: { label: 'SPA (Sales Agreement)', uploadedBy: 'Either' },
  bol: { label: 'BoL (Bill of Lading)', uploadedBy: 'Seller' },
  'payment-proof': { label: 'Payment Proof', uploadedBy: 'Buyer' },
}

export interface DocumentInfo {
  filePath: string
  originalName: string
  mimeType: string
  size: number
  uploadedAt: string
  uploadedBy: string
  status: 'pending' | 'uploaded' | 'approved' | 'rejected'
  notes?: string
  verifiedBy?: string
  verifiedByEmail?: string
  verifiedAt?: string
  signedAt?: string
  version?: number
}

export interface VerifyDocumentDto {
  documentType: VerifiableDocumentType
  status: 'approved' | 'rejected'
  notes?: string
}

export interface VerifyDocumentResponse {
  documentType: string
  status: string
  verifiedBy: string
  verifiedAt: string
  notes?: string
}

// ========================
// Force Phase Change
// ========================

export const TRADE_PHASES = [
  'PR',
  'SCO',
  'ICPO',
  'SPA',
  'PAYMENT',
  'BOL',
  'COMPLETED',
  'CANCELLED',
] as const

export type TradePhaseType = (typeof TRADE_PHASES)[number]

export const TRADE_PHASE_LABELS: Record<TradePhaseType, string> = {
  PR: 'Purchase Request',
  SCO: 'Soft Corporate Offer',
  ICPO: 'Irrevocable CPO',
  SPA: 'Sales Purchase Agreement',
  PAYMENT: 'Payment Verification',
  BOL: 'Bill of Lading',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export interface ForcePhaseChangeDto {
  newPhase: TradePhaseType
  reason: string
  notifyParties?: boolean
}

export interface ForcePhaseChangeResponse {
  previousPhase: string
  newPhase: string
  changedBy: string
  changedAt: string
  reason: string
}

// ========================
// Stalled Trade Reminder
// ========================

export type ReminderRecipientType = 'both' | 'buyer' | 'seller'

export interface SendReminderDto {
  recipientType: ReminderRecipientType
  customMessage?: string
}

export interface SendReminderResponse {
  success: boolean
  sentTo: string[]
  tradeId: string
}
