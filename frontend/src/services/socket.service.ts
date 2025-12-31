import { io, Socket } from 'socket.io-client';
import { Notification } from '../types/notificationTypes';

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Reconnection configuration
const RECONNECT_CONFIG = {
  maxRetries: 10,
  initialDelay: 1000,      // 1 second
  maxDelay: 30000,         // 30 seconds max
  backoffMultiplier: 2,
};

interface Message {
  _id: string;
  text: string;
  sender: any;
  receiver: any;
  createdAt: string;
  readBy: string[];
}

interface MessageReceivedPayload {
  conversationId: string;
  message: Message;
}

interface MessagesReadPayload {
  conversationId: string;
  companyId: string;
}

interface TypingPayload {
  conversationId: string;
  companyId: string;
  isTyping: boolean;
}

// Trade-related interfaces
interface TradeUpdatePayload {
  tradeId: string;
  action: 'accepted' | 'rejected' | 'phase_advanced' | 'completed';
  productName?: string;
  acceptingParty?: 'buyer' | 'seller';
  rejectingParty?: 'buyer' | 'seller';
  reason?: string;
  newPhase?: string;
  totalAmount?: string;
  timestamp: string;
}

interface NegotiationUpdatePayload {
  tradeId: string;
  type: 'negotiation';
  action: 'counter_offer';
  counteringParty: 'buyer' | 'seller';
  newPrice: string;
  productName: string;
  timestamp: string;
}

interface DocumentUploadedPayload {
  tradeId: string;
  type: 'document';
  action: 'document_uploaded';
  documentType: string;
  uploadedBy: 'buyer' | 'seller';
  productName: string;
  timestamp: string;
  timestamp: string;
}

interface NotificationCreatedPayload {
  notification: Notification;
  unreadCount: number;
}

// Connection state type
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

// Connection state change callback
type ConnectionStateCallback = (state: ConnectionState, error?: Error) => void;

class SocketService {
  // Inbox socket
  private socket: Socket | null = null;
  private currentConversationId: string | null = null;
  private currentCompanyId: string | null = null;
  private inboxRetryCount: number = 0;
  private inboxReconnectTimer: NodeJS.Timeout | null = null;
  private inboxConnectionState: ConnectionState = 'disconnected';

  // Trade socket
  private tradeSocket: Socket | null = null;
  private currentUserId: string | null = null;
  private currentTradeId: string | null = null;
  private tradeRetryCount: number = 0;
  private tradeReconnectTimer: NodeJS.Timeout | null = null;
  private tradeConnectionState: ConnectionState = 'disconnected';

  // Connection state callbacks
  private inboxStateCallbacks: Set<ConnectionStateCallback> = new Set();
  private tradeStateCallbacks: Set<ConnectionStateCallback> = new Set();

  // Calculate delay with exponential backoff
  private getReconnectDelay(retryCount: number): number {
    const delay = Math.min(
      RECONNECT_CONFIG.initialDelay * Math.pow(RECONNECT_CONFIG.backoffMultiplier, retryCount),
      RECONNECT_CONFIG.maxDelay
    );
    // Add jitter (±20%) to prevent thundering herd
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.floor(delay + jitter);
  }

  // ==================== Inbox Socket Methods ====================

  private setInboxState(state: ConnectionState, error?: Error): void {
    this.inboxConnectionState = state;
    this.inboxStateCallbacks.forEach(cb => cb(state, error));
  }

  private scheduleInboxReconnect(): void {
    if (this.inboxRetryCount >= RECONNECT_CONFIG.maxRetries) {
      this.setInboxState('failed', new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = this.getReconnectDelay(this.inboxRetryCount);
    this.setInboxState('reconnecting');

    this.inboxReconnectTimer = setTimeout(() => {
      this.inboxRetryCount++;
      this.connect();
    }, delay);
  }

  private clearInboxReconnect(): void {
    if (this.inboxReconnectTimer) {
      clearTimeout(this.inboxReconnectTimer);
      this.inboxReconnectTimer = null;
    }
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.clearInboxReconnect();
    this.setInboxState('connecting');

    this.socket = io(`${SOCKET_URL}/inbox`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: false, // We handle reconnection manually
    });

    this.socket.on('connect', () => {
      this.inboxRetryCount = 0;
      this.setInboxState('connected');
      // Rejoin conversation if we were in one
      if (this.currentConversationId && this.currentCompanyId) {
        this.joinConversation(this.currentConversationId, this.currentCompanyId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.setInboxState('disconnected');
      // Only auto-reconnect for unintentional disconnects
      if (reason !== 'io client disconnect') {
        this.scheduleInboxReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.setInboxState('disconnected', error);
      this.scheduleInboxReconnect();
    });
  }

  disconnect(): void {
    this.clearInboxReconnect();
    this.inboxRetryCount = 0;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentConversationId = null;
    this.currentCompanyId = null;
    this.setInboxState('disconnected');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getInboxConnectionState(): ConnectionState {
    return this.inboxConnectionState;
  }

  onInboxStateChange(callback: ConnectionStateCallback): () => void {
    this.inboxStateCallbacks.add(callback);
    // Return unsubscribe function
    return () => this.inboxStateCallbacks.delete(callback);
  }

  joinConversation(conversationId: string, companyId: string): void {
    this.currentConversationId = conversationId;
    this.currentCompanyId = companyId;

    if (this.socket?.connected) {
      this.socket.emit('join-conversation', { conversationId, companyId });
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket?.connected && this.currentCompanyId) {
      this.socket.emit('leave-conversation', {
        conversationId,
        companyId: this.currentCompanyId,
      });
    }
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
    }
  }

  sendMessage(conversationId: string, companyId: string, text: string): void {
    if (this.socket?.connected) {
      this.socket.emit('send-message', { conversationId, companyId, text });
    }
  }

  markAsRead(conversationId: string, companyId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark-read', { conversationId, companyId });
    }
  }

  emitTyping(conversationId: string, companyId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { conversationId, companyId, isTyping });
    }
  }

  onMessageReceived(callback: (data: MessageReceivedPayload) => void): void {
    this.socket?.on('message-received', callback);
  }

  offMessageReceived(callback?: (data: MessageReceivedPayload) => void): void {
    if (callback) {
      this.socket?.off('message-received', callback);
    } else {
      this.socket?.off('message-received');
    }
  }

  onMessagesRead(callback: (data: MessagesReadPayload) => void): void {
    this.socket?.on('messages-marked-read', callback);
  }

  offMessagesRead(callback?: (data: MessagesReadPayload) => void): void {
    if (callback) {
      this.socket?.off('messages-marked-read', callback);
    } else {
      this.socket?.off('messages-marked-read');
    }
  }

  onTyping(callback: (data: TypingPayload) => void): void {
    this.socket?.on('user-typing', callback);
  }

  offTyping(callback?: (data: TypingPayload) => void): void {
    if (callback) {
      this.socket?.off('user-typing', callback);
    } else {
      this.socket?.off('user-typing');
    }
  }

  // Cleanup all event listeners
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  // ==================== Trade Socket Methods ====================

  private setTradeState(state: ConnectionState, error?: Error): void {
    this.tradeConnectionState = state;
    this.tradeStateCallbacks.forEach(cb => cb(state, error));
  }

  private scheduleTradeReconnect(): void {
    if (this.tradeRetryCount >= RECONNECT_CONFIG.maxRetries) {
      this.setTradeState('failed', new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = this.getReconnectDelay(this.tradeRetryCount);
    this.setTradeState('reconnecting');

    this.tradeReconnectTimer = setTimeout(() => {
      this.tradeRetryCount++;
      this.connectTrade();
    }, delay);
  }

  private clearTradeReconnect(): void {
    if (this.tradeReconnectTimer) {
      clearTimeout(this.tradeReconnectTimer);
      this.tradeReconnectTimer = null;
    }
  }

  connectTrade(): void {
    if (this.tradeSocket?.connected) {
      return;
    }

    this.clearTradeReconnect();
    this.setTradeState('connecting');

    this.tradeSocket = io(`${SOCKET_URL}/trade`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: false, // We handle reconnection manually
    });

    this.tradeSocket.on('connect', () => {
      this.tradeRetryCount = 0;
      this.setTradeState('connected');
      // Rejoin trade if we were in one
      if (this.currentUserId) {
        this.joinTrade(this.currentUserId, this.currentTradeId || undefined);
      }
    });

    this.tradeSocket.on('disconnect', (reason) => {
      this.setTradeState('disconnected');
      // Only auto-reconnect for unintentional disconnects
      if (reason !== 'io client disconnect') {
        this.scheduleTradeReconnect();
      }
    });

    this.tradeSocket.on('connect_error', (error) => {
      this.setTradeState('disconnected', error);
      this.scheduleTradeReconnect();
    });
  }

  disconnectTrade(): void {
    this.clearTradeReconnect();
    this.tradeRetryCount = 0;
    if (this.tradeSocket) {
      this.tradeSocket.disconnect();
      this.tradeSocket = null;
    }
    this.currentUserId = null;
    this.currentTradeId = null;
    this.setTradeState('disconnected');
  }

  isTradeConnected(): boolean {
    return this.tradeSocket?.connected || false;
  }

  getTradeConnectionState(): ConnectionState {
    return this.tradeConnectionState;
  }

  onTradeStateChange(callback: ConnectionStateCallback): () => void {
    this.tradeStateCallbacks.add(callback);
    // Return unsubscribe function
    return () => this.tradeStateCallbacks.delete(callback);
  }

  // Reset retry count and attempt immediate reconnection
  retryTradeConnection(): void {
    this.tradeRetryCount = 0;
    this.clearTradeReconnect();
    this.connectTrade();
  }

  joinTrade(userId: string, tradeId?: string): void {
    this.currentUserId = userId;
    if (tradeId) {
      this.currentTradeId = tradeId;
    }

    if (this.tradeSocket?.connected) {
      this.tradeSocket.emit('join-trade', { userId, tradeId });
    }
  }

  leaveTrade(tradeId: string): void {
    if (this.tradeSocket?.connected) {
      this.tradeSocket.emit('leave-trade', { tradeId });
    }
    if (this.currentTradeId === tradeId) {
      this.currentTradeId = null;
    }
  }

  // Trade update event listeners
  onTradeUpdate(callback: (data: TradeUpdatePayload) => void): void {
    this.tradeSocket?.on('trade-update', callback);
  }

  offTradeUpdate(callback?: (data: TradeUpdatePayload) => void): void {
    if (callback) {
      this.tradeSocket?.off('trade-update', callback);
    } else {
      this.tradeSocket?.off('trade-update');
    }
  }

  // Negotiation update event listeners
  onNegotiationUpdate(callback: (data: NegotiationUpdatePayload) => void): void {
    this.tradeSocket?.on('negotiation-update', callback);
  }

  offNegotiationUpdate(callback?: (data: NegotiationUpdatePayload) => void): void {
    if (callback) {
      this.tradeSocket?.off('negotiation-update', callback);
    } else {
      this.tradeSocket?.off('negotiation-update');
    }
  }

  // Document uploaded event listeners
  onDocumentUploaded(callback: (data: DocumentUploadedPayload) => void): void {
    this.tradeSocket?.on('document-uploaded', callback);
  }

  offDocumentUploaded(callback?: (data: DocumentUploadedPayload) => void): void {
    if (callback) {
      this.tradeSocket?.off('document-uploaded', callback);
    } else {
      this.tradeSocket?.off('document-uploaded');
    }
  }

  // Notification created event listeners
  onNotificationCreated(callback: (data: NotificationCreatedPayload) => void): void {
    this.tradeSocket?.on('notification-created', callback);
  }

  offNotificationCreated(callback?: (data: NotificationCreatedPayload) => void): void {
    if (callback) {
      this.tradeSocket?.off('notification-created', callback);
    } else {
      this.tradeSocket?.off('notification-created');
    }
  }

  // Remove all trade listeners
  removeAllTradeListeners(): void {
    this.tradeSocket?.removeAllListeners();
  }

  // Disconnect all sockets
  disconnectAll(): void {
    this.disconnect();
    this.disconnectTrade();
  }
}

// Export a singleton instance
export const socketService = new SocketService();
export type { ConnectionState, ConnectionStateCallback };
export default socketService;
