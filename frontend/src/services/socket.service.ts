import { io, Socket } from 'socket.io-client';
import { Notification } from '../types/notificationTypes';

// Socket URL should be the origin (not /api) because socket.io connects via /socket.io/ path
// In production/Docker: use current origin (nginx proxies /socket.io/ to backend)
// In development: use explicit backend URL
const getSocketUrl = (): string => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

  // If backend URL is a relative path (e.g., /api), use current origin for sockets
  if (backendUrl.startsWith('/')) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

  // Otherwise use the explicit backend URL (development mode)
  return backendUrl;
};

const SOCKET_URL = getSocketUrl();

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
  editedAt?: string | null;
  readBy: string[];
  reactions?: Array<{
    emoji: string;
    user: any;
    reactedAt?: string;
  }>;
  replyTo?: {
    _id: string;
    text: string;
    sender: any;
    createdAt?: string | null;
  } | null;
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

interface MessageUpdatedPayload {
  conversationId: string;
  message: Message;
}

// Trade-related interfaces
interface TradeUpdatePayload {
  tradeId: string;
  action: 'accepted' | 'rejected' | 'phase_advanced' | 'completed' | 'created' | 'cancelled' | 'documents_invalidated';
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
}

interface NotificationCreatedPayload {
  notification: Notification;
  unreadCount: number;
}

// Issue #17 - New document operation events
interface DocumentSignedPayload {
  tradeId: string;
  type: 'document-signed';
  documentType: string;
  signedBy: 'buyer' | 'seller';
  fullySigned?: boolean;
  timestamp: string;
}

interface DocumentVerifiedPayload {
  tradeId: string;
  type: 'document-verified';
  documentType: string;
  verifiedBy: 'buyer' | 'seller';
  status: 'approved' | 'rejected';
  timestamp: string;
}

interface PhaseAdvancedPayload {
  tradeId: string;
  type: 'phase-advanced';
  previousPhase: string;
  newPhase: string;
  advancedBy: 'buyer' | 'seller';
  timestamp: string;
}

interface TradeCompletedPayload {
  tradeId: string;
  type: 'trade-completed';
  completedBy: 'buyer' | 'seller';
  completedAt: string;
  timestamp: string;
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

  // ═══════════════════════════════════════════════════════════════
  // Bug #9 Fix: Store ALL listeners for reattachment on reconnect
  // ═══════════════════════════════════════════════════════════════

  // Trade socket listeners storage
  private notificationCreatedCallback: ((data: NotificationCreatedPayload) => void) | null = null;
  private tradeUpdateCallback: ((data: TradeUpdatePayload) => void) | null = null;
  private negotiationUpdateCallback: ((data: NegotiationUpdatePayload) => void) | null = null;
  private documentUploadedCallback: ((data: DocumentUploadedPayload) => void) | null = null;
  private documentSignedCallback: ((data: DocumentSignedPayload) => void) | null = null;
  private documentVerifiedCallback: ((data: DocumentVerifiedPayload) => void) | null = null;
  private phaseAdvancedCallback: ((data: PhaseAdvancedPayload) => void) | null = null;
  private tradeCompletedCallback: ((data: TradeCompletedPayload) => void) | null = null;

  // Inbox socket listeners storage
  private messageReceivedCallback: ((data: MessageReceivedPayload) => void) | null = null;
  private messagesReadCallback: ((data: MessagesReadPayload) => void) | null = null;
  private typingCallback: ((data: TypingPayload) => void) | null = null;
  private messageUpdatedCallback: ((data: MessageUpdatedPayload) => void) | null = null;

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
      // Bug #9 Fix: Reattach all inbox listeners after reconnect
      this.reattachInboxListeners();
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

  sendMessage(
    conversationId: string,
    companyId: string,
    text: string,
    replyTo?: string | null,
  ): void {
    if (this.socket?.connected) {
      this.socket.emit('send-message', { conversationId, companyId, text, replyTo });
    }
  }

  editMessage(
    conversationId: string,
    companyId: string,
    messageId: string,
    text: string,
  ): void {
    if (this.socket?.connected) {
      this.socket.emit('edit-message', { conversationId, companyId, messageId, text });
    }
  }

  toggleReaction(
    conversationId: string,
    companyId: string,
    messageId: string,
    emoji: string,
  ): void {
    if (this.socket?.connected) {
      this.socket.emit('toggle-reaction', { conversationId, companyId, messageId, emoji });
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

  // Bug #9 Fix: Store callback for reattachment on reconnect
  onMessageReceived(callback: (data: MessageReceivedPayload) => void): void {
    this.messageReceivedCallback = callback;
    this.socket?.off('message-received'); // Remove existing first
    this.socket?.on('message-received', callback);
  }

  offMessageReceived(callback?: (data: MessageReceivedPayload) => void): void {
    if (callback) {
      this.socket?.off('message-received', callback);
      if (this.messageReceivedCallback === callback) {
        this.messageReceivedCallback = null;
      }
    } else {
      this.socket?.off('message-received');
      this.messageReceivedCallback = null;
    }
  }

  // Bug #9 Fix: Store callback for reattachment on reconnect
  onMessagesRead(callback: (data: MessagesReadPayload) => void): void {
    this.messagesReadCallback = callback;
    this.socket?.off('messages-marked-read');
    this.socket?.on('messages-marked-read', callback);
  }

  offMessagesRead(callback?: (data: MessagesReadPayload) => void): void {
    if (callback) {
      this.socket?.off('messages-marked-read', callback);
      if (this.messagesReadCallback === callback) {
        this.messagesReadCallback = null;
      }
    } else {
      this.socket?.off('messages-marked-read');
      this.messagesReadCallback = null;
    }
  }

  // Bug #9 Fix: Store callback for reattachment on reconnect
  onTyping(callback: (data: TypingPayload) => void): void {
    this.typingCallback = callback;
    this.socket?.off('user-typing');
    this.socket?.on('user-typing', callback);
  }

  // Bug #9 Fix: Store callback for reattachment on reconnect
  onMessageUpdated(callback: (data: MessageUpdatedPayload) => void): void {
    this.messageUpdatedCallback = callback;
    this.socket?.off('message-updated');
    this.socket?.on('message-updated', callback);
  }

  offMessageUpdated(callback?: (data: MessageUpdatedPayload) => void): void {
    if (callback) {
      this.socket?.off('message-updated', callback);
      if (this.messageUpdatedCallback === callback) {
        this.messageUpdatedCallback = null;
      }
    } else {
      this.socket?.off('message-updated');
      this.messageUpdatedCallback = null;
    }
  }

  offTyping(callback?: (data: TypingPayload) => void): void {
    if (callback) {
      this.socket?.off('user-typing', callback);
      if (this.typingCallback === callback) {
        this.typingCallback = null;
      }
    } else {
      this.socket?.off('user-typing');
      this.typingCallback = null;
    }
  }

  // Cleanup all event listeners
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  // Bug #9 Fix: Reattach all stored inbox listeners after reconnect
  private reattachInboxListeners(): void {
    if (!this.socket) return;

    if (this.messageReceivedCallback) {
      this.socket.off('message-received');
      this.socket.on('message-received', this.messageReceivedCallback);
    }
    if (this.messagesReadCallback) {
      this.socket.off('messages-marked-read');
      this.socket.on('messages-marked-read', this.messagesReadCallback);
    }
    if (this.typingCallback) {
      this.socket.off('user-typing');
      this.socket.on('user-typing', this.typingCallback);
    }
    if (this.messageUpdatedCallback) {
      this.socket.off('message-updated');
      this.socket.on('message-updated', this.messageUpdatedCallback);
    }
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

    // Reattach any stored listeners to the new socket
    this.reattachTradeListeners();

    this.tradeSocket.on('connect', () => {
      console.log('%c[SocketService] Trade socket CONNECTED!', 'background: green; color: white; font-weight: bold;', 'Socket ID:', this.tradeSocket?.id);
      this.tradeRetryCount = 0;
      this.setTradeState('connected');
      // Reattach listeners after connect (ensures they're bound to the connected socket)
      this.reattachTradeListeners();
      // Rejoin trade if we were in one
      if (this.currentUserId) {
        console.log('[SocketService] Rejoining trade with userId:', this.currentUserId);
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
      console.log('%c[SocketService] Emitting join-trade', 'background: purple; color: white;', { userId, tradeId, socketId: this.tradeSocket.id });
      this.tradeSocket.emit('join-trade', { userId, tradeId });
    } else {
      console.log('[SocketService] joinTrade: socket not connected yet, will rejoin on connect. userId:', userId);
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
    // Store callback for reattachment on reconnect
    this.notificationCreatedCallback = callback;
    if (this.tradeSocket) {
      // IMPORTANT: Remove existing listeners first to prevent duplicates
      this.tradeSocket.off('notification-created');
      console.log('[SocketService] Attaching notification-created listener (removed old first)');
      this.tradeSocket.on('notification-created', callback);
    } else {
      console.warn('[SocketService] Cannot attach notification listener - tradeSocket is null');
    }
  }

  offNotificationCreated(callback?: (data: NotificationCreatedPayload) => void): void {
    if (callback) {
      this.tradeSocket?.off('notification-created', callback);
      if (this.notificationCreatedCallback === callback) {
        this.notificationCreatedCallback = null;
      }
    } else {
      this.tradeSocket?.off('notification-created');
      this.notificationCreatedCallback = null;
    }
  }

  // Reattach stored listeners to the current socket (called after reconnect)
  private reattachTradeListeners(): void {
    if (this.notificationCreatedCallback && this.tradeSocket) {
      // IMPORTANT: Remove existing listeners first to prevent duplicates
      this.tradeSocket.off('notification-created');
      console.log('[SocketService] Reattaching notification-created listener (removed old first)');
      this.tradeSocket.on('notification-created', this.notificationCreatedCallback);
    } else {
      console.log('[SocketService] reattachTradeListeners: callback=' + !!this.notificationCreatedCallback + ', socket=' + !!this.tradeSocket);
    }
  }

  // Issue #17 - Document signed event listeners
  onDocumentSigned(callback: (data: DocumentSignedPayload) => void): void {
    this.tradeSocket?.on('document-signed', callback);
  }

  offDocumentSigned(callback?: (data: DocumentSignedPayload) => void): void {
    if (callback) {
      this.tradeSocket?.off('document-signed', callback);
    } else {
      this.tradeSocket?.off('document-signed');
    }
  }

  // Issue #17 - Document verified event listeners
  onDocumentVerified(callback: (data: DocumentVerifiedPayload) => void): void {
    this.tradeSocket?.on('document-verified', callback);
  }

  offDocumentVerified(callback?: (data: DocumentVerifiedPayload) => void): void {
    if (callback) {
      this.tradeSocket?.off('document-verified', callback);
    } else {
      this.tradeSocket?.off('document-verified');
    }
  }

  // Issue #17 - Phase advanced event listeners
  onPhaseAdvanced(callback: (data: PhaseAdvancedPayload) => void): void {
    this.tradeSocket?.on('phase-advanced', callback);
  }

  offPhaseAdvanced(callback?: (data: PhaseAdvancedPayload) => void): void {
    if (callback) {
      this.tradeSocket?.off('phase-advanced', callback);
    } else {
      this.tradeSocket?.off('phase-advanced');
    }
  }

  // Issue #17 - Trade completed event listeners
  onTradeCompleted(callback: (data: TradeCompletedPayload) => void): void {
    this.tradeSocket?.on('trade-completed', callback);
  }

  offTradeCompleted(callback?: (data: TradeCompletedPayload) => void): void {
    if (callback) {
      this.tradeSocket?.off('trade-completed', callback);
    } else {
      this.tradeSocket?.off('trade-completed');
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
