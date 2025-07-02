import { Product } from '../types/product';

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  addedAt: string;
  product?: Product;
}

class WishlistService {
  private wishlist: WishlistItem[] = [];

  constructor() {
    this.loadWishlistFromStorage();
  }

  // Load wishlist from localStorage
  private loadWishlistFromStorage(): void {
    try {
      const wishlistData = localStorage.getItem('wishlist');
      if (wishlistData) {
        this.wishlist = JSON.parse(wishlistData);
      }
    } catch (error) {
      console.error('Error loading wishlist from storage:', error);
      this.wishlist = [];
    }
  }

  // Save wishlist to localStorage
  private saveWishlistToStorage(): void {
    try {
      localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
      // Emit wishlist updated event for real-time UI updates
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
    } catch (error) {
      console.error('Error saving wishlist to storage:', error);
    }
  }

  // Add item to wishlist
  addToWishlist(product: Product): boolean {
    try {
      // Check if item already exists in wishlist
      const existingItem = this.wishlist.find(item => item.productId === product.id);
      
      if (existingItem) {
        console.log('Item already in wishlist:', product.name);
        return false; // Item already exists
      }

      // Add new item to wishlist
      const wishlistItem: WishlistItem = {
        id: `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0] || product.primaryImage || '',
        price: product.price,
        addedAt: new Date().toISOString(),
        product: product
      };
      
      this.wishlist.push(wishlistItem);
      this.saveWishlistToStorage();
      console.log('Item added to wishlist:', product.name);
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return false;
    }
  }

  // Remove item from wishlist
  removeFromWishlist(productId: string): boolean {
    try {
      const index = this.wishlist.findIndex(item => item.productId === productId);
      if (index >= 0) {
        this.wishlist.splice(index, 1);
        this.saveWishlistToStorage();
        console.log('Item removed from wishlist');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return false;
    }
  }

  // Get wishlist items
  getWishlistItems(): WishlistItem[] {
    return [...this.wishlist];
  }

  // Clear wishlist
  clearWishlist(): void {
    this.wishlist = [];
    this.saveWishlistToStorage();
  }

  // Get wishlist item count
  getWishlistCount(): number {
    return this.wishlist.length;
  }

  // Check if product is in wishlist
  isInWishlist(productId: string): boolean {
    return this.wishlist.some(item => item.productId === productId);
  }

  // Toggle wishlist item (add if not exists, remove if exists)
  toggleWishlist(product: Product): boolean {
    if (this.isInWishlist(product.id)) {
      return this.removeFromWishlist(product.id);
    } else {
      return this.addToWishlist(product);
    }
  }
}

const wishlistService = new WishlistService();
export default wishlistService; 