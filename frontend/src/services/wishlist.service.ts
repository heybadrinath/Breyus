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