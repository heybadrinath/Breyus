import authService from './auth.service';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/backend'}/chat`;

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  messageType: 'text' | 'image' | 'file' | 'trade_update';
  content: string;
  attachmentUrl?: string;
  isRead: boolean;
  isDelivered: boolean;
  tradeReferenceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversation {
  id: string;
  buyerId: string;
  sellerId: string;
  tradeId?: string;
  lastMessageId?: string;
  lastMessageAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // User details
  buyerFirstName?: string;
  buyerLastName?: string;
  buyerEmail?: string;
  buyerProfileImage?: string;
  
  sellerFirstName?: string;
  sellerLastName?: string;
  sellerEmail?: string;
  sellerProfileImage?: string;
  
  // Last message details
  lastMessageContent?: string;
  lastMessageType?: string;
  lastMessageSenderId?: string;
  
  // Trade details
  tradeStatus?: string;
  tradeOfferedPrice?: number;
  
  // Product details
  productName?: string;
  productImage?: string;
  
  // Unread count
  unreadCount?: number;
}

export interface SendMessageRequest {
  conversationId?: string;
  receiverId: string;
  messageType?: 'text' | 'image' | 'file' | 'trade_update';
  content: string;
  attachmentUrl?: string;
  tradeReferenceId?: string;
}

export interface CreateConversationRequest {
  buyerId: string;
  sellerId: string;
  tradeId?: string;
  initialMessage?: string;
}

class ChatService {
  private conversations: ChatConversation[] = [];
  private messages: { [conversationId: string]: ChatMessage[] } = {};
  private eventListeners: { [event: string]: Function[] } = {};

  constructor() {
    this.setupEventListeners();
  }

  // Event handling for real-time updates
  private setupEventListeners() {
    // In a real app, this would connect to WebSocket or Server-Sent Events
    // For now, we'll use polling or manual refresh
  }

  addEventListener(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  // Get all conversations for the current user
  async getConversations(): Promise<ChatConversation[]> {
    try {
      const user = authService.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/conversations`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const conversations = await response.json();
      this.conversations = conversations;
      this.emit('conversations-updated', conversations);
      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // Get messages for a specific conversation
  async getMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${API_URL}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const messages = await response.json();
      this.messages[conversationId] = messages;
      this.emit('messages-updated', { conversationId, messages });
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Send a message
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage | null> {
    try {
      const user = authService.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...request,
          senderId: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const message = await response.json();
      
      // Update local messages
      if (message.conversationId && this.messages[message.conversationId]) {
        this.messages[message.conversationId].push(message);
      }
      
      this.emit('message-sent', message);
      this.emit('messages-updated', { 
        conversationId: message.conversationId, 
        messages: this.messages[message.conversationId] || [] 
      });
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Create a new conversation
  async createConversation(request: CreateConversationRequest): Promise<ChatConversation | null> {
    try {
      const response = await fetch(`${API_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const conversation = await response.json();
      this.conversations.unshift(conversation);
      this.emit('conversation-created', conversation);
      this.emit('conversations-updated', this.conversations);
      
      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/conversations/${conversationId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark messages as read');
      }

      // Update local messages
      if (this.messages[conversationId]) {
        this.messages[conversationId] = this.messages[conversationId].map(msg => ({
          ...msg,
          isRead: true
        }));
      }

      this.emit('messages-read', { conversationId });
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  // Get unread message count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await fetch(`${API_URL}/unread-count`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const { count } = await response.json();
      this.emit('unread-count-updated', count);
      return count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Search conversations
  async searchConversations(query: string): Promise<ChatConversation[]> {
    try {
      const response = await fetch(`${API_URL}/conversations/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to search conversations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching conversations:', error);
      return [];
    }
  }

  // Get conversation by trade ID
  async getConversationByTradeId(tradeId: string): Promise<ChatConversation | null> {
    try {
      const response = await fetch(`${API_URL}/conversations/by-trade/${tradeId}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No conversation exists for this trade yet
        }
        throw new Error('Failed to fetch conversation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching conversation by trade ID:', error);
      return null;
    }
  }

  // Start chat from trade (when trade is accepted)
  async startChatFromTrade(tradeId: string, buyerId: string, sellerId: string): Promise<ChatConversation | null> {
    try {
      // Check if conversation already exists
      const existingConversation = await this.getConversationByTradeId(tradeId);
      if (existingConversation) {
        return existingConversation;
      }

      // Create new conversation
      const conversation = await this.createConversation({
        buyerId,
        sellerId,
        tradeId,
        initialMessage: 'Trade request accepted! You can now chat directly.'
      });

      return conversation;
    } catch (error) {
      console.error('Error starting chat from trade:', error);
      return null;
    }
  }

  // Get cached conversations
  getCachedConversations(): ChatConversation[] {
    return this.conversations;
  }

  // Get cached messages for a conversation
  getCachedMessages(conversationId: string): ChatMessage[] {
    return this.messages[conversationId] || [];
  }

  // Format user name for display
  formatUserName(conversation: ChatConversation, userId: string): string {
    const user = authService.getUser();
    if (!user) return 'Unknown User';

    if (userId === conversation.buyerId) {
      return conversation.buyerFirstName && conversation.buyerLastName
        ? `${conversation.buyerFirstName} ${conversation.buyerLastName}`
        : conversation.buyerEmail || 'Buyer';
    } else if (userId === conversation.sellerId) {
      return conversation.sellerFirstName && conversation.sellerLastName
        ? `${conversation.sellerFirstName} ${conversation.sellerLastName}`
        : conversation.sellerEmail || 'Seller';
    }

    return 'Unknown User';
  }

  // Get other user in conversation
  getOtherUser(conversation: ChatConversation): { id: string; name: string; email: string; profileImage?: string } {
    const user = authService.getUser();
    if (!user) {
      return { id: '', name: 'Unknown', email: '' };
    }

    if (user.id === conversation.buyerId) {
      // Current user is buyer, return seller info
      return {
        id: conversation.sellerId,
        name: conversation.sellerFirstName && conversation.sellerLastName
          ? `${conversation.sellerFirstName} ${conversation.sellerLastName}`
          : conversation.sellerEmail || 'Seller',
        email: conversation.sellerEmail || '',
        profileImage: conversation.sellerProfileImage
      };
    } else {
      // Current user is seller, return buyer info
      return {
        id: conversation.buyerId,
        name: conversation.buyerFirstName && conversation.buyerLastName
          ? `${conversation.buyerFirstName} ${conversation.buyerLastName}`
          : conversation.buyerEmail || 'Buyer',
        email: conversation.buyerEmail || '',
        profileImage: conversation.buyerProfileImage
      };
    }
  }

  // Format message time
  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }
}

const chatService = new ChatService();
export default chatService; 