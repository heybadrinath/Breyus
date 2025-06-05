import axios from 'axios';
import authService from './auth.service';
import tradeService from './trade.service';
import { Product } from '../types/product';

const API_URL = `${process.env.REACT_APP_API_URL || 'https://breyus.com/backend'}/cart`;

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
  addedAt: string;
}

export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  totalMRP: number;
  discount: number;
  platformFee: number;
  shippingFee: number;
  totalAmount: number;
}

export interface TradeRequestResult {
  success: boolean;
  tradeId?: string;
  message: string;
  error?: string;
}

class CartService {
  private cart: CartItem[] = [];

  constructor() {
    this.loadCartFromStorage();
  }

  // Load cart from localStorage
  private loadCartFromStorage(): void {
    try {
      const cartData = localStorage.getItem('cart');
      if (cartData) {
        this.cart = JSON.parse(cartData);
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      this.cart = [];
    }
  }

  // Save cart to localStorage
  private saveCartToStorage(): void {
    try {
      localStorage.setItem('cart', JSON.stringify(this.cart));
      // Emit cart updated event for real-time UI updates
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }

  // Add item to cart
  async addToCart(product: Product, quantity: number = 1): Promise<boolean> {
    try {
      const user = authService.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if item already exists in cart
      const existingItemIndex = this.cart.findIndex(item => item.productId === product.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        this.cart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        const cartItem: CartItem = {
          id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: product.id,
          productName: product.name,
          productImage: product.images?.[0] || product.primaryImage || product.productImage || '',
          price: product.price,
          quantity: quantity,
          sellerId: product.sellerId || '',
          sellerName: product.sellerName || 'Unknown Seller',
          addedAt: new Date().toISOString()
        };
        this.cart.push(cartItem);
      }

      this.saveCartToStorage();
      console.log('Item added to cart:', product.name);
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  }

  // Create trade request for a single item
  async createTradeRequestForItem(cartItem: CartItem, message?: string): Promise<TradeRequestResult> {
    try {
      const user = authService.getUser();
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated'
        };
      }

      if (!cartItem.sellerId) {
        return {
          success: false,
          message: 'Seller information not available for this product'
        };
      }

      const tradeRequest = {
        seller_id: cartItem.sellerId,
        product_id: cartItem.productId,
        offered_price: cartItem.price,
        quantity: cartItem.quantity,
        buyer_message: message || `Purchase request for ${cartItem.productName}`,
        trade_type: 'purchase_request',
        is_urgent: false
      };

      console.log('Creating trade request:', tradeRequest);

      const response = await tradeService.createTradeRequest(tradeRequest);
      
      return {
        success: true,
        tradeId: response.id,
        message: `Trade request sent to ${cartItem.sellerName} for ${cartItem.productName}`
      };
    } catch (error) {
      console.error('Error creating trade request:', error);
      return {
        success: false,
        message: 'Failed to create trade request',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Convert cart items to trade requests (for checkout)
  async convertCartToTradeRequests(selectedItemIds?: string[], message?: string): Promise<{
    successful: TradeRequestResult[];
    failed: TradeRequestResult[];
    summary: string;
  }> {
    const successful: TradeRequestResult[] = [];
    const failed: TradeRequestResult[] = [];

    // Get items to process (either selected items or all items)
    const itemsToProcess = selectedItemIds 
      ? this.cart.filter(item => selectedItemIds.includes(item.id))
      : this.cart;

    console.log(`Converting ${itemsToProcess.length} cart items to trade requests`);

    for (const item of itemsToProcess) {
      const result = await this.createTradeRequestForItem(item, message);
      
      if (result.success) {
        successful.push(result);
        // Remove from cart after successful trade request
        this.removeFromCart(item.id);
      } else {
        failed.push(result);
      }
    }

    const summary = `${successful.length} trade requests sent successfully. ${failed.length} failed.`;
    
    return {
      successful,
      failed,
      summary
    };
  }

  // Quick purchase (create trade request directly from product)
  async quickPurchase(product: Product, quantity: number, message?: string): Promise<TradeRequestResult> {
    try {
      const user = authService.getUser();
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated'
        };
      }

      if (!product.sellerId) {
        return {
          success: false,
          message: 'Seller information not available for this product'
        };
      }

      const tradeRequest = {
        seller_id: product.sellerId,
        product_id: product.id,
        offered_price: product.price,
        quantity: quantity,
        buyer_message: message || `Purchase request for ${product.name}`,
        trade_type: 'purchase_request',
        is_urgent: false
      };

      console.log('Creating quick purchase trade request:', tradeRequest);

      const response = await tradeService.createTradeRequest(tradeRequest);
      
      return {
        success: true,
        tradeId: response.id,
        message: `Trade request sent to ${product.sellerName || 'seller'} for ${product.name}`
      };
    } catch (error) {
      console.error('Error creating quick purchase trade request:', error);
      return {
        success: false,
        message: 'Failed to create trade request',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Remove item from cart
  removeFromCart(itemId: string): boolean {
    try {
      const index = this.cart.findIndex(item => item.id === itemId);
      if (index >= 0) {
        this.cart.splice(index, 1);
        this.saveCartToStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  }

  // Update item quantity
  updateQuantity(itemId: string, quantity: number): boolean {
    try {
      const item = this.cart.find(item => item.id === itemId);
      if (item) {
        if (quantity <= 0) {
          return this.removeFromCart(itemId);
        } else {
          item.quantity = quantity;
          this.saveCartToStorage();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error updating quantity:', error);
      return false;
    }
  }

  // Get cart items
  getCartItems(): CartItem[] {
    return [...this.cart];
  }

  // Get cart summary with calculations
  getCartSummary(): CartSummary {
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalMRP = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Calculate discount (example: 5% discount)
    const discount = totalMRP * 0.05;
    
    // Platform fee (example: ₹10 if order > ₹500, else ₹20)
    const platformFee = totalMRP > 500 ? 10 : 20;
    
    // Shipping fee (free if order > ₹1000, else ₹50)
    const shippingFee = totalMRP > 1000 ? 0 : 50;
    
    const totalAmount = totalMRP - discount + platformFee + shippingFee;

    return {
      items: this.cart,
      totalItems,
      totalMRP,
      discount,
      platformFee,
      shippingFee,
      totalAmount
    };
  }

  // Clear cart
  clearCart(): void {
    this.cart = [];
    this.saveCartToStorage();
  }

  // Get cart item count
  getCartCount(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Check if product is in cart
  isInCart(productId: string): boolean {
    return this.cart.some(item => item.productId === productId);
  }

  // Get item by product ID
  getCartItemByProductId(productId: string): CartItem | undefined {
    return this.cart.find(item => item.productId === productId);
  }
}

const cartService = new CartService();
export default cartService; 