/**
 * AI Service
 * Handles all AI-related API calls
 */

import {
  AISearchInput,
  CommoditySearchInput,
  MarketAnalysisInput,
  GravityScoreInput,
  SearchFromProductInput,
  MergedSearchResult,
  CommoditySearchResult,
  CommodityClassification,
  HSChapter,
  AnalysisInitiateResponse,
  AnalysisResultResponse,
  GravityScoreResponse,
  SellerInventoryResult,
  APIResponse,
  SavedContact,
  CommodityOption,
} from '../types/aiTypes';

const AI_ENDPOINT = process.env.REACT_APP_BACKEND_URL + '/ai';
const COMMODITIES_ENDPOINT = process.env.REACT_APP_BACKEND_URL + '/commodities';

// ═══════════════════════════════════════════════════════════════
// MAIN SEARCH
// ═══════════════════════════════════════════════════════════════

/**
 * Main AI search - for both buyers and sellers
 * Returns 3-tier results based on user role
 */
export const aiSearch = async (input: AISearchInput): Promise<APIResponse<MergedSearchResult>> => {
  try {
    const response = await fetch(`${AI_ENDPOINT}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'AI search failed');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

// ═══════════════════════════════════════════════════════════════
// COMMODITY SEARCH
// ═══════════════════════════════════════════════════════════════

/**
 * Search commodities for selection page
 * Returns mainstream + niche options
 */
export const searchCommodities = async (
  input: CommoditySearchInput
): Promise<APIResponse<CommoditySearchResult>> => {
  try {
    const response = await fetch(`${AI_ENDPOINT}/commodity-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Commodity search failed');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

/**
 * Get HS chapters list (01-99)
 */
export const getHsChapters = async (): Promise<APIResponse<HSChapter[]>> => {
  try {
    const response = await fetch(`${COMMODITIES_ENDPOINT}/chapters`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch HS chapters');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

/**
 * Get commodities by HS chapter
 */
export const getCommoditiesByChapter = async (chapter: number): Promise<APIResponse<CommodityOption[]>> => {
  try {
    const response = await fetch(`${COMMODITIES_ENDPOINT}/by-chapter/${chapter}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch commodities');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

/**
 * Classify a commodity (check if mainstream or niche)
 */
export const classifyCommodity = async (
  name: string,
  hsCode: string
): Promise<APIResponse<CommodityClassification>> => {
  try {
    const response = await fetch(`${COMMODITIES_ENDPOINT}/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, hsCode }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Commodity classification failed');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

/**
 * Get all mainstream commodities
 */
export const getMainstreamCommodities = async (): Promise<APIResponse<CommodityOption[]>> => {
  try {
    const response = await fetch(`${COMMODITIES_ENDPOINT}/mainstream`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch mainstream commodities');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

// ═══════════════════════════════════════════════════════════════
// MARKET ANALYSIS (Async with Polling)
// ═══════════════════════════════════════════════════════════════

/**
 * Start async market analysis
 * Returns jobId for polling
 */
export const startAnalysis = async (
  input: MarketAnalysisInput
): Promise<APIResponse<AnalysisInitiateResponse>> => {
  try {
    const response = await fetch(`${AI_ENDPOINT}/analysis/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to start analysis');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

/**
 * Poll for analysis results
 */
export const getAnalysisResults = async (
  jobId: string
): Promise<APIResponse<AnalysisResultResponse>> => {
  try {
    const response = await fetch(`${AI_ENDPOINT}/analysis/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch analysis results');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

// ═══════════════════════════════════════════════════════════════
// GRAVITY SCORE
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate gravity score for a potential trade
 */
export const calculateGravityScore = async (
  input: GravityScoreInput
): Promise<APIResponse<GravityScoreResponse>> => {
  try {
    const response = await fetch(`${AI_ENDPOINT}/gravity-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to calculate gravity score');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

/**
 * Check AI server health
 */
export const checkAIHealth = async (): Promise<APIResponse<{ status: string; message: string }>> => {
  try {
    const response = await fetch(`${AI_ENDPOINT}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'AI health check failed');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

// ═══════════════════════════════════════════════════════════════
// SELLER INVENTORY (for inventory-based buyer search)
// ═══════════════════════════════════════════════════════════════

/**
 * Get seller's inventory for AI selection page
 * Returns products the seller can search buyers for
 */
export const getSellerInventory = async (): Promise<APIResponse<SellerInventoryResult>> => {
  try {
    const response = await fetch(`${AI_ENDPOINT}/seller/inventory`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch seller inventory');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

/**
 * Search buyers for a specific product from seller's inventory
 */
export const searchBuyersForProduct = async (
  input: SearchFromProductInput
): Promise<APIResponse<MergedSearchResult>> => {
  try {
    const response = await fetch(`${AI_ENDPOINT}/search/from-product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to search buyers');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

// ═══════════════════════════════════════════════════════════════
// WISHLIST CONTACTS (for off-platform AI results)
// ═══════════════════════════════════════════════════════════════

const WISHLIST_ENDPOINT = process.env.REACT_APP_BACKEND_URL + '/wishlist';

/**
 * Save an AI contact to wishlist
 */
export const saveAIContact = async (contact: SavedContact): Promise<APIResponse<any>> => {
  try {
    const response = await fetch(`${WISHLIST_ENDPOINT}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceType: 'ai_contact',
        savedContactName: contact.name,
        savedContactEmail: contact.email,
        savedContactPhone: contact.phone,
        savedContactCountry: contact.country,
        savedContactAddress: contact.address,
        savedCommodity: contact.commodity,
        savedHsCode: contact.hsCode,
        savedMatchScore: contact.matchScore,
        savedContactRole: contact.role,
        notes: contact.notes,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to save contact');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

/**
 * Get saved AI contacts from wishlist
 */
export const getSavedContacts = async (): Promise<APIResponse<SavedContact[]>> => {
  try {
    const response = await fetch(`${WISHLIST_ENDPOINT}/contacts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch saved contacts');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};

/**
 * Remove a saved contact from wishlist
 */
export const removeSavedContact = async (contactId: string): Promise<APIResponse<any>> => {
  try {
    const response = await fetch(`${WISHLIST_ENDPOINT}/contact/${contactId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to remove contact');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred');
  }
};
