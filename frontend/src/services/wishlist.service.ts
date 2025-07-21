const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/wishlist";

export const getWishlist = async (): Promise<any[]> => {
  const response = await fetch(`${BACKEND_END_POINT}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch wishlist');
  }
  return await response.json();
};

export const addToWishlist = async (productId: string): Promise<any> => {
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

export const removeFromWishlist = async (productId: string): Promise<any> => {
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