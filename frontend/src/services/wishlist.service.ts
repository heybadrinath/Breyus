const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/wishlist";

export interface WishlistProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  productImage?: string;
  primaryImage?: string;
  category?: string;
}

export interface WishlistItem {
  _id: string;
  productId: WishlistProduct;
  addedAt: string;
}

export interface WishlistResponse {
  statusCode: number;
  message: string;
  data: WishlistItem[];
}

export interface WishlistActionResponse {
  statusCode: number;
  message: string;
  data?: {
    productId: string;
  };
}

export const getWishlist = async (): Promise<WishlistItem[]> => {
  const response = await fetch(`${BACKEND_END_POINT}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch wishlist');
  }
  const result = await response.json();
  // Handle both wrapped response and direct array formats
  return result.data || result;
};

export const addToWishlist = async (productId: string): Promise<WishlistActionResponse> => {
  const response = await fetch(`${BACKEND_END_POINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to add to wishlist');
  }
  return await response.json();
};

export const removeFromWishlist = async (productId: string): Promise<WishlistActionResponse> => {
  const response = await fetch(`${BACKEND_END_POINT}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to remove from wishlist');
  }
  return await response.json();
};

// ═══════════════════════════════════════════════════════════════
// FAVOURITE COMPANIES (platform companies favourited by buyers)
// ═══════════════════════════════════════════════════════════════

export interface FavouriteCompany {
  id: string;
  companyId: string;
  companyName: string;
  companyAddress: string;
  profilePicture: string;
  bannerImage: string;
  isKycVerified: boolean;
  primaryEmail: string;
  notes: string;
  dateAdded: string;
}

export interface FavouriteCompaniesResponse {
  statusCode: number;
  message: string;
  data: FavouriteCompany[];
}

export interface FavouriteCheckResponse {
  statusCode: number;
  data: {
    isFavourite: boolean;
  };
}

/**
 * Get all favourite companies for the current user
 */
export const getFavouriteCompanies = async (): Promise<FavouriteCompany[]> => {
  const response = await fetch(`${BACKEND_END_POINT}/favourite-companies`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch favourite companies');
  }
  const result: FavouriteCompaniesResponse = await response.json();
  return result.data || [];
};

/**
 * Add a company to favourites
 */
export const addFavouriteCompany = async (companyId: string, notes?: string): Promise<void> => {
  const response = await fetch(`${BACKEND_END_POINT}/favourite-company`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ companyId, notes }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to add company to favourites');
  }
};

/**
 * Remove a company from favourites
 */
export const removeFavouriteCompany = async (companyId: string): Promise<void> => {
  const response = await fetch(`${BACKEND_END_POINT}/favourite-company/${companyId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to remove company from favourites');
  }
};

/**
 * Check if a company is favourited by the current user
 */
export const checkIsFavouriteCompany = async (companyId: string): Promise<boolean> => {
  const response = await fetch(`${BACKEND_END_POINT}/favourite-company/${companyId}/check`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to check favourite status');
  }
  const result: FavouriteCheckResponse = await response.json();
  return result.data.isFavourite;
}; 