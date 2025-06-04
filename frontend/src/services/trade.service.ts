import axios, { AxiosResponse } from 'axios';
import { io, Socket } from 'socket.io-client';
import messageService from './message.service';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/backend';

export interface TradeRequest {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'counter_offered' | 'expired' | 'completed' | 'cancelled';
  trade_type: 'purchase_request' | 'bulk_order' | 'spot_trade' | 'contract_trade';
  offered_price: number;
  counter_offer_price?: number;
  quantity: number;
  buyer_message?: string;
  seller_message?: string;
  rejection_reason?: string;
  trade_terms?: any;
  shipping_details?: any;
  expires_at?: string;
  accepted_at?: string;
  completed_at?: string;
  final_price?: number;
  is_urgent: boolean;
  counter_offer_count: number;
  created_at: string;
  updated_at: string;
  buyer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  seller?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  product?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    productImage?: string;
  };
}

export interface TradeFilters {
  status?: string;
  trade_type?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface TradeResponse {
  trades: TradeRequest[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateTradeRequest {
  seller_id: string;
  product_id: string;
  offered_price: number;
  quantity: number;
  buyer_message?: string;
  trade_type?: string;
  trade_terms?: any;
  shipping_details?: any;
  is_urgent?: boolean;
}

export interface CounterOffer {
  counter_offer_price: number;
  seller_message?: string;
  trade_terms?: any;
}

export interface TradeStats {
  total_incoming: number;
  pending: number;
  accepted: number;
  rejected: number;
  expired: number;
  today_incoming: number;
}

// WebSocket event types
export interface TradeNotification {
  type: string;
  trade?: TradeRequest;
  action?: string;
  message: string;
  timestamp: string;
}

class TradeService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    // Get token from localStorage
    this.token = localStorage.getItem('token');
    
    // Set up axios interceptor for authentication
    axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Set up trade acceptance listener for automatic messaging
    this.setupTradeAcceptanceListener();
  }

  // Initialize WebSocket connection
  connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        reject(new Error('No authentication token found'));
        return;
      }

      this.socket = io(`${API_BASE_URL}/trades`, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to trade WebSocket');
        this.socket?.emit('subscribe-to-trades');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from trade WebSocket');
      });

      // Listen for various trade events
      this.socket.on('new-trade-request', (data: TradeNotification) => {
        this.emitEvent('new-trade-request', data);
      });

      this.socket.on('trade-status-update', (data: TradeNotification) => {
        this.emitEvent('trade-status-update', data);
      });

      this.socket.on('counter-offer', (data: TradeNotification) => {
        this.emitEvent('counter-offer', data);
      });

      this.socket.on('trade-expired', (data: TradeNotification) => {
        this.emitEvent('trade-expired', data);
      });

      this.socket.on('urgent-trade', (data: TradeNotification) => {
        this.emitEvent('urgent-trade', data);
      });

      this.socket.on('system-announcement', (data: TradeNotification) => {
        this.emitEvent('system-announcement', data);
      });

      this.socket.on('trade-update', (data: TradeNotification) => {
        this.emitEvent('trade-update', data);
      });
    });
  }

  // Disconnect WebSocket
  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event listener management
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Helper method to get auth headers
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // API Methods

  // Get incoming trade requests for seller
  async getIncomingTrades(filters: TradeFilters = {}): Promise<TradeResponse> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response: AxiosResponse<TradeResponse> = await axios.get(
        `${API_BASE_URL}/trades/incoming?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching incoming trades:', error);
      throw error;
    }
  }

  // Accept a trade request
  async acceptTrade(tradeId: string, message?: string): Promise<TradeRequest> {
    try {
      const response: AxiosResponse<TradeRequest> = await axios.post(
        `${API_BASE_URL}/trades/${tradeId}/accept`,
        { message }
      );
      
      // Automatically start conversation between buyer and seller when trade is accepted
      try {
        await this.handleTradeAcceptanceMessaging(response.data);
      } catch (messagingError) {
        console.warn('Failed to set up messaging for accepted trade:', messagingError);
        // Don't fail the trade acceptance if messaging setup fails
      }
      
      return response.data;
    } catch (error) {
      console.error('Error accepting trade:', error);
      throw error;
    }
  }

  // Handle messaging setup when trade is accepted
  private async handleTradeAcceptanceMessaging(trade: TradeRequest): Promise<void> {
    try {
      console.log('Setting up messaging for accepted trade:', trade.id);
      
      // Get current user to determine who to start conversation with
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = currentUser.id;
      
      // Determine the other party (buyer or seller)
      const otherPartyId = currentUserId === trade.buyer_id ? trade.seller_id : trade.buyer_id;
      const otherPartyRole = currentUserId === trade.buyer_id ? 'seller' : 'buyer';
      
      console.log(`Current user (${currentUserId}) starting conversation with ${otherPartyRole} (${otherPartyId})`);
      
      // Start conversation between buyer and seller
      const conversationResult = await messageService.startConversation(otherPartyId);
      
      if (conversationResult.success && conversationResult.conversation) {
        console.log('Conversation created for trade:', trade.id);
        
        // Send initial message about the accepted trade
        const initialMessage = `🎉 Great news! The trade request for "${trade.product?.name}" has been accepted!\n\nTrade Details:\n• Quantity: ${trade.quantity}\n• Price: ₹${trade.offered_price?.toLocaleString()}\n• Total: ₹${((trade.offered_price || 0) * trade.quantity).toLocaleString()}\n\nYou can now discuss delivery details and coordinate the transaction.`;
        
        await messageService.sendMessage(
          otherPartyId,
          initialMessage,
          'text'
        );
        
        console.log('Initial trade acceptance message sent to', otherPartyRole);
      }
    } catch (error) {
      console.error('Error setting up messaging for trade acceptance:', error);
      throw error;
    }
  }

  // Listen for trade acceptance events
  setupTradeAcceptanceListener(): void {
    this.addEventListener('trade-status-update', async (data: TradeNotification) => {
      if (data.trade && data.action === 'accepted') {
        try {
          await this.handleTradeAcceptanceMessaging(data.trade);
        } catch (error) {
          console.error('Error handling trade acceptance messaging:', error);
        }
      }
    });
  }

  // Reject a trade request
  async rejectTrade(tradeId: string, rejectionReason?: string): Promise<TradeRequest> {
    try {
      const response: AxiosResponse<TradeRequest> = await axios.post(
        `${API_BASE_URL}/trades/${tradeId}/reject`,
        { rejection_reason: rejectionReason }
      );
      return response.data;
    } catch (error) {
      console.error('Error rejecting trade:', error);
      throw error;
    }
  }

  // Make a counter offer
  async makeCounterOffer(tradeId: string, counterOffer: CounterOffer): Promise<TradeRequest> {
    try {
      const response: AxiosResponse<TradeRequest> = await axios.patch(
        `${API_BASE_URL}/trades/${tradeId}/counter-offer`,
        counterOffer
      );
      return response.data;
    } catch (error) {
      console.error('Error making counter offer:', error);
      throw error;
    }
  }

  // Get trade details
  async getTradeDetails(tradeId: string): Promise<TradeRequest> {
    try {
      const response: AxiosResponse<TradeRequest> = await axios.get(
        `${API_BASE_URL}/trades/${tradeId}/details`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching trade details:', error);
      throw error;
    }
  }

  // Create a new trade request (for buyers)
  async createTradeRequest(tradeData: CreateTradeRequest): Promise<TradeRequest> {
    try {
      const response: AxiosResponse<TradeRequest> = await axios.post(
        `${API_BASE_URL}/trades`,
        tradeData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating trade request:', error);
      throw error;
    }
  }

  // Bulk accept trades
  async bulkAcceptTrades(tradeIds: string[]): Promise<{
    successful: TradeRequest[];
    failed: { tradeId: string; error: string }[];
  }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/trades/bulk-accept`,
        { trade_ids: tradeIds }
      );
      return response.data;
    } catch (error) {
      console.error('Error bulk accepting trades:', error);
      throw error;
    }
  }

  // Get trade statistics
  async getTradeStats(): Promise<TradeStats> {
    try {
      const response: AxiosResponse<TradeStats> = await axios.get(
        `${API_BASE_URL}/trades/stats`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching trade stats:', error);
      throw error;
    }
  }

  // Get buyer's trade requests
  async getMyTradeRequests(filters: TradeFilters = {}): Promise<TradeResponse> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response: AxiosResponse<TradeResponse> = await axios.get(
        `${API_BASE_URL}/trades/my-requests?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching my trade requests:', error);
      throw error;
    }
  }

  // Get trades by buyer ID (for buyer dashboard)
  async getTradesByBuyer(buyerId: string, filters?: { status?: string; type?: string }) {
    try {
      console.log('Fetching trades for buyer:', buyerId);
      
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('trade_type', filters.type);
      
      const url = params.toString() ? 
        `${API_BASE_URL}/trades/my-requests?${params.toString()}` : 
        `${API_BASE_URL}/trades/my-requests`;
      
      const response = await axios.get(url, {
        headers: this.getAuthHeaders()
      });
      
      console.log('Buyer trades received:', response.data);
      
      return { 
        success: true, 
        trades: response.data.trades || response.data,
        message: 'Trades fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching buyer trades:', error);
      
      if (axios.isAxiosError(error)) {
        return { 
          success: false, 
          message: error.response?.data?.message || 'Failed to fetch trades',
          trades: []
        };
      }
      
      return { success: false, message: 'Failed to fetch trades', trades: [] };
    }
  }

  // Cancel a trade request (buyer can cancel pending requests)
  async cancelTradeRequest(tradeId: string) {
    try {
      console.log('Cancelling trade request:', tradeId);
      
      const response = await axios.put(`${API_BASE_URL}/${tradeId}/cancel`, {}, {
        headers: this.getAuthHeaders()
      });
      
      console.log('Trade request cancelled:', response.data);
      
      this.emitEvent('tradeCancelled', response.data);
      
      return { 
        success: true, 
        trade: response.data,
        message: 'Trade request cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling trade request:', error);
      
      if (axios.isAxiosError(error)) {
        return { 
          success: false, 
          message: error.response?.data?.message || 'Failed to cancel trade request'
        };
      }
      
      return { success: false, message: 'Failed to cancel trade request' };
    }
  }

  // Get trade statistics for buyer
  async getBuyerTradeStats(buyerId: string) {
    try {
      console.log('Fetching buyer trade statistics:', buyerId);
      
      const response = await axios.get(`${API_BASE_URL}/buyer/${buyerId}/stats`, {
        headers: this.getAuthHeaders()
      });
      
      console.log('Buyer trade stats received:', response.data);
      
      return { 
        success: true, 
        stats: response.data,
        message: 'Statistics fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching buyer trade stats:', error);
      
      if (axios.isAxiosError(error)) {
        return { 
          success: false, 
          message: error.response?.data?.message || 'Failed to fetch statistics',
          stats: {
            totalRequests: 0,
            pendingRequests: 0,
            acceptedRequests: 0,
            rejectedRequests: 0,
            totalSpent: 0
          }
        };
      }
      
      return { 
        success: false, 
        message: 'Failed to fetch statistics',
        stats: {
          totalRequests: 0,
          pendingRequests: 0,
          acceptedRequests: 0,
          rejectedRequests: 0,
          totalSpent: 0
        }
      };
    }
  }

  // Utility methods
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'accepted':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'counter_offered':
        return 'text-blue-600 bg-blue-100';
      case 'expired':
        return 'text-gray-600 bg-gray-100';
      case 'completed':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getUrgencyBadge(isUrgent: boolean): string {
    return isUrgent ? 'text-red-600 bg-red-100 border-red-200' : '';
  }
}

const tradeService = new TradeService();
export default tradeService; 