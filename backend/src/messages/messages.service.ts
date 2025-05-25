import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  timestamp: Date;
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
  participants: string[];
  messages: Message[];
}

export interface ChatRoom {
  id: string;
  participants: string[];
  messages: Message[];
}

@Injectable()
export class MessagesService {
  private chatRooms: Map<string, ChatRoom> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private userConversations: Map<string, string[]> = new Map();

  // Legacy chat room methods (keeping for compatibility)
  getChatRoomById(roomId: string): ChatRoom | undefined {
    return this.chatRooms.get(roomId);
  }

  getChatRoomByParticipants(participant1: string, participant2: string): ChatRoom | undefined {
    for (const room of this.chatRooms.values()) {
      if (
        room.participants.includes(participant1) &&
        room.participants.includes(participant2)
      ) {
        return room;
      }
    }
    return undefined;
  }

  createChatRoom(participant1: string, participant2: string): ChatRoom {
    const roomId = `${participant1}_${participant2}`;
    const newRoom: ChatRoom = {
      id: roomId,
      participants: [participant1, participant2],
      messages: [],
    };
    this.chatRooms.set(roomId, newRoom);
    return newRoom;
  }

  addMessage(roomId: string, message: Message): Message {
    const room = this.getChatRoomById(roomId);
    if (room) {
      room.messages.push(message);
      return message;
    }
    throw new Error('Chat room not found');
  }

  getMessages(roomId: string): Message[] {
    const room = this.getChatRoomById(roomId);
    return room ? room.messages : [];
  }

  getUserChatRooms(userId: string): ChatRoom[] {
    const userRooms: ChatRoom[] = [];
    for (const room of this.chatRooms.values()) {
      if (room.participants.includes(userId)) {
        userRooms.push(room);
      }
    }
    return userRooms;
  }

  // New conversation-based methods
  startConversation(userId: string, participantId: string): Conversation {
    // Check if conversation already exists
    const existingConversation = this.findConversationByParticipants(userId, participantId);
    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const conversationId = uuidv4();
    const now = new Date().toISOString();
    
    const conversation: Conversation = {
      id: conversationId,
      participant1Id: userId,
      participant2Id: participantId,
      participants: [userId, participantId],
      messages: [],
      unreadCount: 0,
      createdAt: now,
      updatedAt: now,
      // Note: In a real implementation, you'd fetch user details from a user service
      participant1: {
        id: userId,
        firstName: 'User',
        lastName: userId.substring(0, 8),
        email: `user${userId.substring(0, 8)}@example.com`,
      },
      participant2: {
        id: participantId,
        firstName: 'User',
        lastName: participantId.substring(0, 8),
        email: `user${participantId.substring(0, 8)}@example.com`,
      },
    };

    this.conversations.set(conversationId, conversation);
    
    // Update user conversation mappings
    this.addConversationToUser(userId, conversationId);
    this.addConversationToUser(participantId, conversationId);

    return conversation;
  }

  private findConversationByParticipants(userId1: string, userId2: string): Conversation | undefined {
    for (const conversation of this.conversations.values()) {
      if (
        (conversation.participant1Id === userId1 && conversation.participant2Id === userId2) ||
        (conversation.participant1Id === userId2 && conversation.participant2Id === userId1)
      ) {
        return conversation;
      }
    }
    return undefined;
  }

  private addConversationToUser(userId: string, conversationId: string): void {
    const userConversations = this.userConversations.get(userId) || [];
    if (!userConversations.includes(conversationId)) {
      userConversations.push(conversationId);
      this.userConversations.set(userId, userConversations);
    }
  }

  getUserConversations(userId: string): Conversation[] {
    const conversationIds = this.userConversations.get(userId) || [];
    return conversationIds
      .map(id => this.conversations.get(id))
      .filter(conversation => conversation !== undefined) as Conversation[];
  }

  getConversationMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Message[] {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check if user is participant
    if (!conversation.participants.includes(userId)) {
      throw new Error('Access denied to this conversation');
    }

    // Simple pagination (in a real implementation, you'd use database pagination)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return conversation.messages.slice(startIndex, endIndex);
  }

  sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
  ): Message {
    // Find or create conversation
    const conversation = this.startConversation(senderId, receiverId);
    
    const messageId = uuidv4();
    const now = new Date();
    
    const message: Message = {
      id: messageId,
      senderId,
      receiverId,
      content,
      type,
      isRead: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      timestamp: now,
      sender: conversation.participant1Id === senderId ? conversation.participant1 : conversation.participant2,
      receiver: conversation.participant1Id === receiverId ? conversation.participant1 : conversation.participant2,
    };

    // Add message to conversation
    conversation.messages.push(message);
    conversation.lastMessage = message;
    conversation.updatedAt = now.toISOString();
    
    // Update unread count for receiver
    if (senderId !== receiverId) {
      conversation.unreadCount += 1;
    }

    return message;
  }

  markConversationAsRead(conversationId: string, userId: string): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check if user is participant
    if (!conversation.participants.includes(userId)) {
      throw new Error('Access denied to this conversation');
    }

    // Mark messages as read
    conversation.messages.forEach(message => {
      if (message.receiverId === userId) {
        message.isRead = true;
      }
    });

    // Reset unread count
    conversation.unreadCount = 0;
  }

  searchUserConversations(userId: string, query: string): Conversation[] {
    const userConversations = this.getUserConversations(userId);
    
    if (!query.trim()) {
      return userConversations;
    }

    return userConversations.filter(conversation => {
      // Search in participant names or last message content
      const otherParticipant = conversation.participant1Id === userId 
        ? conversation.participant2 
        : conversation.participant1;
      
      const participantName = `${otherParticipant?.firstName} ${otherParticipant?.lastName}`.toLowerCase();
      const lastMessageContent = conversation.lastMessage?.content?.toLowerCase() || '';
      
      return participantName.includes(query.toLowerCase()) || 
             lastMessageContent.includes(query.toLowerCase());
    });
  }

  deleteConversation(conversationId: string, userId: string): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check if user is participant
    if (!conversation.participants.includes(userId)) {
      throw new Error('Access denied to this conversation');
    }

    // Remove conversation
    this.conversations.delete(conversationId);
    
    // Remove from user mappings
    conversation.participants.forEach(participantId => {
      const userConversations = this.userConversations.get(participantId) || [];
      const updatedConversations = userConversations.filter(id => id !== conversationId);
      this.userConversations.set(participantId, updatedConversations);
    });
  }
} 