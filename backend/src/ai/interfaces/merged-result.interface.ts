/**
 * Merged Result Interfaces
 * These are the backend's response to the frontend after processing AI results
 */

// ============================================
// Discriminant type for type-safe narrowing
// ============================================

export type ResultType = 'partner' | 'product';

// ============================================
// Enriched Partner (with platform awareness)
// ============================================

export interface EnrichedPartner {
  /**
   * Discriminant property for type narrowing
   * Use: if (result.resultType === 'partner') { ... }
   */
  resultType: 'partner';

  // From AI
  id?: string;
  name: string;
  matchScore: number;
  matchReason: string;
  commodity: string;
  country?: string;

  // Contact info (for off-platform)
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };

  // Platform awareness
  isOnPlatform: boolean;
  platformCompanyId?: string;
  platformUserId?: string;

  // Calculated scores
  probability?: number;
  riskLevel?: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  priceFluctuation?: number;

  // Source tracking
  sourceType:
    | 'platform_trade_history'
    | 'platform_and_ai'
    | 'platform_only'
    | 'ai_only';

  // Trade history (for platform_trade_history type)
  tradeCount?: number;
  totalQuantity?: number;
  lastTradeDate?: Date;
}

// ============================================
// Product Result (for buyer searches)
// ============================================

export interface ProductResult {
  /**
   * Discriminant property for type narrowing
   * Use: if (result.resultType === 'product') { ... }
   */
  resultType: 'product';

  // Product info
  _id: string;
  name: string;
  price: string;
  currency: string;
  hsnCode: string;
  category: string;
  description: string;
  stock: string;
  stockUnit: string;
  moq: string;
  moqUnit: string;

  // Seller info
  userId: string;
  sellerName?: string;
  sellerCompanyId?: string;
  sellerCountry?: string;

  // Seller contact info (for consistency with EnrichedPartner)
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };

  // Product images
  productImages?: string[];

  // Incoterms
  selectedIncoterm?: string;
  nearestPort?: string;
  exportLocation?: string;

  // Platform awareness
  isOnPlatform: boolean;
  sourceType: 'platform_and_ai' | 'platform_recommended' | 'platform_only';

  // AI match info (if in AI results)
  aiMatchScore?: number;
  aiMatchReason?: string;

  // Calculated scores (matching EnrichedPartner for UI consistency)
  probability?: number;
  riskLevel?: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  priceFluctuation?: number;
}

// ============================================
// Merged Search Result
// ============================================

export interface MergedSearchResult {
  // 3-tier results
  tier1: (EnrichedPartner | ProductResult)[]; // Best matches
  tier2: (EnrichedPartner | ProductResult)[]; // Secondary matches
  tier3: EnrichedPartner[]; // AI-only (off-platform)

  // Metadata
  totalMatches: number;
  searchType: 'buyer' | 'seller';
  commodity: string;
  hsCode?: string;

  // Deployment capability metadata
  recommendationMode: 'external_ai' | 'platform_recommendation';
  analysisAvailable: boolean;

  // Search parameters
  searchParams: {
    country?: string;
    port?: string;
    priceRange?: {
      min: number;
      max: number;
    };
  };

  // Warning message (e.g., when country filter falls back to global results)
  warning?: string;
}

// ============================================
// Commodity Search Result (for selection page)
// ============================================

export interface CommodityOption {
  name: string;
  hsCode?: string;
  category?: string;
  source: 'mainstream' | 'platform' | 'ai';
  isMainstream: boolean;
}

export interface CommoditySearchResult {
  mainstream: CommodityOption[];
  niche: CommodityOption[];
  totalResults: number;
}

// ============================================
// Seller Inventory Item (for seller AI page)
// ============================================

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
  isNicheCommodity: boolean;
}

export interface SellerInventoryResult {
  products: SellerInventoryItem[];
  totalProducts: number;
  companyName: string;
}
