/**
 * AI Types for Frontend
 * Matches backend AI module interfaces
 */

// ═══════════════════════════════════════════════════════════════
// INPUT TYPES
// ═══════════════════════════════════════════════════════════════

export interface PriceRange {
  min: number;
  max: number;
}

export interface AISearchInput {
  commodity: string;
  country?: string;
  port?: string;
  priceRange?: PriceRange;
  hsCode?: string;
  limit?: number;
}

export interface CommoditySearchInput {
  query: string;
  limit?: number;
}

export interface MarketAnalysisInput {
  commodity: string;
  hsCode?: string;
  destinationCountry?: string;
  sourceCountry?: string;
}

export interface GravityScoreInput {
  commodity: string;
  hsCode?: string;
  buyerId?: string;
  buyerName?: string;
  sellerId?: string;
  sellerName?: string;
  buyerCountry?: string;
  sellerCountry?: string;
  priceRange?: PriceRange;
}

export interface SearchFromProductInput {
  productId: string;
  country?: string;
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════
// RESULT TYPES
// ═══════════════════════════════════════════════════════════════

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

export type RiskLevel = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
export type SourceType = 'platform_trade_history' | 'platform_and_ai' | 'platform_only' | 'ai_only';
export type ResultType = 'partner' | 'product';

/**
 * Enriched Partner - For seller AI results (buyers)
 * Use resultType === 'partner' for type narrowing
 */
export interface EnrichedPartner {
  /** Discriminant for type narrowing: if (result.resultType === 'partner') */
  resultType: 'partner';
  id: string;
  name: string;
  matchScore: number;
  matchReason?: string;
  commodity?: string;
  country?: string;
  contactInfo?: ContactInfo;
  isOnPlatform: boolean;
  platformCompanyId?: string;
  platformUserId?: string;
  sourceType: SourceType;
  probability: number;
  riskLevel: RiskLevel;
  tradeCount?: number;
  totalQuantity?: number;
  lastTradeDate?: string;
}

/**
 * Product Result - For buyer AI results (products/sellers)
 * Use resultType === 'product' for type narrowing
 */
export interface ProductResult {
  /** Discriminant for type narrowing: if (result.resultType === 'product') */
  resultType: 'product';
  _id: string;
  name: string;
  price?: string;
  currency?: string;
  hsnCode?: string;
  category?: string;
  description?: string;
  stock?: string;
  stockUnit?: string;
  moq?: string;
  moqUnit?: string;
  userId?: string;
  sellerName?: string;
  sellerCompanyId?: string;
  sellerCountry?: string;
  productImages?: string[];
  selectedIncoterm?: string;
  nearestPort?: string;
  exportLocation?: string;
  isOnPlatform: boolean;
  sourceType: SourceType;
  aiMatchScore?: number;
  aiMatchReason?: string;
}

/**
 * Merged Search Result - Main response from /ai/search
 */
export interface MergedSearchResult {
  tier1: (EnrichedPartner | ProductResult)[];
  tier2: (EnrichedPartner | ProductResult)[];
  tier3: EnrichedPartner[];
  totalMatches: number;
  searchType: 'buyer' | 'seller';
  commodity: string;
  hsCode?: string;
  searchParams: {
    country?: string;
    port?: string;
    priceRange?: PriceRange;
  };
}

// ═══════════════════════════════════════════════════════════════
// COMMODITY TYPES
// ═══════════════════════════════════════════════════════════════

export type CommoditySource = 'mainstream' | 'platform' | 'ai';

export interface CommodityOption {
  name: string;
  hsCode?: string;
  category?: string;
  source: CommoditySource;
  isMainstream: boolean;
}

export interface CommoditySearchResult {
  mainstream: CommodityOption[];
  niche: CommodityOption[];
  totalResults: number;
}

export interface HSChapter {
  chapter: number;
  name: string;
}

export interface CommodityClassification {
  isMainstream: boolean;
  matchedCommodity?: {
    name: string;
    hsCode: string;
    category: string;
  };
}

// ═══════════════════════════════════════════════════════════════
// ANALYSIS TYPES
// ═══════════════════════════════════════════════════════════════

export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface AnalysisInitiateResponse {
  jobId: string;
  status: AnalysisStatus;
  message: string;
  estimatedTime?: number;
}

export interface PriceTrendData {
  month: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
}

export interface CountryTradeVolume {
  country: string;
  volume: number;
  percentage: number;
}

export interface AnalysisResult {
  commodity: string;
  hsCode?: string;
  summary: string;
  priceTrends?: PriceTrendData[];
  topExporters?: CountryTradeVolume[];
  topImporters?: CountryTradeVolume[];
  demandForecast?: {
    direction: 'increasing' | 'stable' | 'decreasing';
    confidence: number;
    explanation: string;
  };
  seasonality?: {
    peakMonths: string[];
    lowMonths: string[];
  };
  riskFactors?: string[];
  opportunities?: string[];
}

export interface AnalysisResultResponse {
  jobId: string;
  status: AnalysisStatus;
  progress?: number;
  result?: AnalysisResult;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// GRAVITY SCORE TYPES
// ═══════════════════════════════════════════════════════════════

export interface GravityScoreResponse {
  gravityScore: number;
  confidence: number;
  breakdown: {
    volumeScore: number;
    proximityScore: number;
    priceScore: number;
    historyScore: number;
    demandScore: number;
  };
  recommendation: 'highly_recommended' | 'recommended' | 'neutral' | 'caution' | 'not_recommended';
  factors: {
    positive: string[];
    negative: string[];
  };
}

// ═══════════════════════════════════════════════════════════════
// UI STATE TYPES
// ═══════════════════════════════════════════════════════════════

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AISearchState {
  loadingState: LoadingState;
  results: MergedSearchResult | null;
  error: string | null;
  searchInput: AISearchInput | null;
}

export interface AnalysisState {
  loadingState: LoadingState;
  jobId: string | null;
  progress: number;
  result: AnalysisResult | null;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════
// WISHLIST CONTACT TYPES
// ═══════════════════════════════════════════════════════════════

export interface SavedContact {
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  address?: string;
  commodity?: string;
  hsCode?: string;
  matchScore?: number;
  role?: 'buyer' | 'seller';
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSE WRAPPER
// ═══════════════════════════════════════════════════════════════

export interface APIResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// ═══════════════════════════════════════════════════════════════
// SELLER INVENTORY TYPES
// ═══════════════════════════════════════════════════════════════

export interface SellerInventoryItem {
  _id: string;
  name: string;
  category: string;
  price: string;
  currency: string;
  priceUnit: string;
  stock: string;
  stockUnit: string;
  moq: string;
  moqUnit: string;
  hsnCode: string;
  isActive: boolean;
  productImages?: string[];
  selectedIncoterm?: string;
  nearestPort?: string;
}

export interface SellerInventoryResult {
  products: SellerInventoryItem[];
  totalProducts: number;
  companyName: string;
}
