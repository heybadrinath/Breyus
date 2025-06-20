import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import authService from './auth.service';

const API_URL = 'http://localhost:5000/backend/messages';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  participant1?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
  participant2?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
}

class MessageService {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupAxiosInterceptors();
  }

  private setupAxiosInterceptors() {
    axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Initialize WebSocket connection for real-time messaging
  async connectSocket(): Promise<void> {
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

      this.socket = io('http://localhost:5000/messages', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('Connected to messaging WebSocket');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from messaging WebSocket');
      });

      // Listen for real-time events
      this.socket.on('new-message', (message: Message) => {
        this.emitEvent('new-message', message);
      });

      this.socket.on('message-read', (data: { messageId: string; conversationId: string }) => {
        this.emitEvent('message-read', data);
      });

      this.socket.on('typing', (data: { userId: string; conversationId: string; isTyping: boolean }) => {
        this.emitEvent('typing', data);
      });

      this.socket.on('user-online', (data: { userId: string; isOnline: boolean }) => {
        this.emitEvent('user-online', data);
      });
    });
  }

  // Disconnect WebSocket
  disconnectSocket(): void {
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

  // Get all conversations for current user
  async getConversations(): Promise<{ success: boolean; conversations: Conversation[]; message?: string }> {
    try {
      console.log('Fetching conversations...');
      const response = await axios.get(`${API_URL}/conversations`);
      
      return {
        success: true,
        conversations: response.data,
        message: 'Conversations fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          conversations: [],
          message: error.response?.data?.message || 'Failed to fetch conversations'
        };
      }
      
      return {
        success: false,
        conversations: [],
        message: 'Failed to fetch conversations'
      };
    }
  }

  // Get messages for a specific conversation
  async getMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<{ success: boolean; messages: Message[]; totalPages?: number; message?: string }> {
    try {
      console.log('Fetching messages for conversation:', conversationId);
      const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
      
      return {
        success: true,
        messages: response.data.messages || response.data,
        totalPages: response.data.totalPages,
        message: 'Messages fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          messages: [],
          message: error.response?.data?.message || 'Failed to fetch messages'
        };
      }
      
      return {
        success: false,
        messages: [],
        message: 'Failed to fetch messages'
      };
    }
  }

  // Send a new message
  async sendMessage(receiverId: string, content: string, type: 'text' | 'image' | 'file' = 'text'): Promise<{ success: boolean; message?: Message; error?: string }> {
    try {
      console.log('Sending message to:', receiverId);
      const response = await axios.post(`${API_URL}/send`, {
        receiverId,
        content,
        type
      });
      
      // Emit via WebSocket for real-time updates
      if (this.socket) {
        this.socket.emit('send-message', response.data);
      }
      
      return {
        success: true,
        message: response.data
      };
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.message || 'Failed to send message'
        };
      }
      
      return {
        success: false,
        error: 'Failed to send message'
      };
    }
  }

  // Mark messages as read
  async markAsRead(conversationId: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Marking messages as read for conversation:', conversationId);
      await axios.put(`${API_URL}/conversations/${conversationId}/read`);
      
      // Emit via WebSocket for real-time updates
      if (this.socket) {
        this.socket.emit('mark-read', { conversationId });
      }
      
      return {
        success: true,
        message: 'Messages marked as read'
      };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to mark messages as read'
        };
      }
      
      return {
        success: false,
        message: 'Failed to mark messages as read'
      };
    }
  }

  // Start or get conversation with a user
  async startConversation(participantId: string): Promise<{ success: boolean; conversation?: Conversation; message?: string }> {
    try {
      console.log('Starting conversation with:', participantId);
      const response = await axios.post(`${API_URL}/conversations/start`, {
        participantId
      });
      
      return {
        success: true,
        conversation: response.data,
        message: 'Conversation started successfully'
      };
    } catch (error) {
      console.error('Error starting conversation:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to start conversation'
        };
      }
      
      return {
        success: false,
        message: 'Failed to start conversation'
      };
    }
  }

  // Send typing indicator
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', { conversationId, isTyping });
    }
  }

  // Get unread message count
  async getUnreadCount(): Promise<{ success: boolean; count: number; message?: string }> {
    try {
      const response = await axios.get(`${API_URL}/unread-count`);
      
      return {
        success: true,
        count: response.data.count || 0,
        message: 'Unread count fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      
      return {
        success: false,
        count: 0,
        message: 'Failed to fetch unread count'
      };
    }
  }

  // Search conversations
  async searchConversations(query: string): Promise<{ success: boolean; conversations: Conversation[]; message?: string }> {
    try {
      console.log('Searching conversations with query:', query);
      const response = await axios.get(`${API_URL}/conversations/search?q=${encodeURIComponent(query)}`);
      
      return {
        success: true,
        conversations: response.data,
        message: 'Search completed successfully'
      };
    } catch (error) {
      console.error('Error searching conversations:', error);
      
      return {
        success: false,
        conversations: [],
        message: 'Search failed'
      };
    }
  }

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Deleting conversation:', conversationId);
      await axios.delete(`${API_URL}/conversations/${conversationId}`);
      
      return {
        success: true,
        message: 'Conversation deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      
      return {
        success: false,
        message: 'Failed to delete conversation'
      };
    }
  }

  // Helper methods
  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { 
        weekday: 'short' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  getOtherParticipant(conversation: Conversation, currentUserId: string) {
    return conversation.participant1Id === currentUserId 
      ? conversation.participant2 
      : conversation.participant1;
  }
}

const messageService = new MessageService();
export default messageService; 