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

// Helper function to provide user-friendly error messages
const getReadableErrorMessage = (error: unknown, context: string): string => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // Network/connection errors
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('connection')) {
      return `Unable to connect to the server. Please check your internet connection and try again.`;
    }
    // Timeout errors
    if (msg.includes('timeout')) {
      return `The request timed out. The server may be busy. Please try again in a moment.`;
    }
    // Server errors
    if (msg.includes('500') || msg.includes('internal')) {
      return `The server encountered an error. Please try again later.`;
    }
    if (msg.includes('503') || msg.includes('unavailable')) {
      return `The AI service is temporarily unavailable. Please try again in a few minutes.`;
    }
    // Return original message if it's already user-friendly
    return error.message;
  }
  return `${context} failed. Please try again.`;
};

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
    throw new Error(getReadableErrorMessage(error, 'AI search'));
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
    throw new Error(getReadableErrorMessage(error, 'Commodity search'));
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
    throw new Error(getReadableErrorMessage(error, 'Request'));
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
    throw new Error(getReadableErrorMessage(error, 'Request'));
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
    throw new Error(getReadableErrorMessage(error, 'Request'));
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
    throw new Error(getReadableErrorMessage(error, 'Request'));
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
    throw new Error(getReadableErrorMessage(error, 'Request'));
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
    throw new Error(getReadableErrorMessage(error, 'Request'));
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
    throw new Error(getReadableErrorMessage(error, 'Request'));
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
    throw new Error(getReadableErrorMessage(error, 'Request'));
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
    throw new Error(getReadableErrorMessage(error, 'Request'));
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
    throw new Error(getReadableErrorMessage(error, 'Request'));
  }
};

// ═══════════════════════════════════════════════════════════════
// WISHLIST CONTACTS (for off-platform AI results)
// ═══════════════════════════════════════════════════════════════

const WISHLIST_ENDPOINT = process.env.REACT_APP_BACKEND_URL + '/wishlist';

/**
 * Save an AI contact to wishlist
 * Note: Backend SaveContactDto expects simple field names (name, email, etc.)
 * which are then mapped to database field names (savedContactName, etc.) by the service
 */
export const saveAIContact = async (contact: SavedContact): Promise<APIResponse<any>> => {
  try {
    const response = await fetch(`${WISHLIST_ENDPOINT}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        country: contact.country,
        address: contact.address,
        commodity: contact.commodity,
        hsCode: contact.hsCode,
        matchScore: contact.matchScore,
        role: contact.role,
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
    throw new Error(getReadableErrorMessage(error, 'Request'));
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
    throw new Error(getReadableErrorMessage(error, 'Request'));
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
    throw new Error(getReadableErrorMessage(error, 'Request'));
  }
};

/**
 * Update notes for a saved contact
 */
export const updateContactNotes = async (
  contactId: string,
  notes: string
): Promise<APIResponse<SavedContact>> => {
  try {
    const response = await fetch(`${WISHLIST_ENDPOINT}/contact/${contactId}/notes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update contact notes');
    }

    return await response.json();
  } catch (error) {
    throw new Error(getReadableErrorMessage(error, 'Request'));
  }
};
