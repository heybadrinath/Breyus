import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InboxService } from './inbox.service';
import { NotificationService } from '../notification/notification.service';
import { TradeGateway } from '../trade/trade.gateway';

interface JoinConversationPayload {
  conversationId: string;
  companyId: string;
}

interface SendMessagePayload {
  conversationId: string;
  companyId: string;
  text: string;
}

interface MarkReadPayload {
  conversationId: string;
  companyId: string;
}

interface TypingPayload {
  conversationId: string;
  companyId: string;
  isTyping: boolean;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/inbox',
})
export class InboxGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, Set<string>> = new Map(); // companyId -> Set of socketIds
  private activeConversations: Map<string, Map<string, Set<string>>> = new Map(); // conversationId -> companyId -> socketIds

  constructor(
    private readonly inboxService: InboxService,
    private readonly notificationService: NotificationService,
    private readonly tradeGateway: TradeGateway,
  ) { }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Remove socket from all tracked users
    this.connectedUsers.forEach((sockets, companyId) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.connectedUsers.delete(companyId);
      }
    });

    this.removeSocketFromActiveConversations(client.id);
  }

  @SubscribeMessage('join-conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinConversationPayload,
  ) {
    const { conversationId, companyId } = payload;
    const room = `conversation-${conversationId}`;
    client.join(room);

    // Track active conversation participation
    if (!this.activeConversations.has(conversationId)) {
      this.activeConversations.set(conversationId, new Map());
    }
    const companyMap = this.activeConversations.get(conversationId);
    if (companyMap) {
      if (!companyMap.has(companyId)) {
        companyMap.set(companyId, new Set());
      }
      companyMap.get(companyId)?.add(client.id);
    }

    // Track connected user
    if (!this.connectedUsers.has(companyId)) {
      this.connectedUsers.set(companyId, new Set());
    }
    this.connectedUsers.get(companyId)?.add(client.id);

    console.log(`Company ${companyId} joined room ${room}`);
    return { success: true, room };
  }

  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinConversationPayload,
  ) {
    const { conversationId, companyId } = payload;
    const room = `conversation-${conversationId}`;
    client.leave(room);

    // Remove from active conversations
    const companyMap = this.activeConversations.get(conversationId);
    if (companyMap) {
      const socketIds = companyMap.get(companyId);
      if (socketIds) {
        socketIds.delete(client.id);
        if (socketIds.size === 0) {
          companyMap.delete(companyId);
        }
      }
      if (companyMap.size === 0) {
        this.activeConversations.delete(conversationId);
      }
    }

    console.log(`Client ${client.id} left room ${room}`);
    return { success: true };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    try {
      const { conversationId, companyId, text } = payload;

      // Save message to database
      const message = await this.inboxService.sendMessage(
        conversationId,
        companyId,
        text,
      );

      // Broadcast to all users in the conversation room
      const room = `conversation-${conversationId}`;
      this.server.to(room).emit('message-received', {
        conversationId,
        message,
      });

      // Send notification if receiver is not active in this conversation
      try {
        const receiverId = message.receiver.toString();
        // Check if receiver company is active
        const isReceiverActive = (this.activeConversations.get(conversationId)?.get(receiverId)?.size || 0) > 0;

        if (!isReceiverActive) {
          // Get all users for the receiver company
          const users = await this.inboxService.getUsersByCompany(receiverId);

          for (const user of users) {
            const messagePreview = text.length > 50 ? `${text.substring(0, 50)}...` : text;
            const recipientRole = user.role === 'admin' ? 'buyer' : 'seller';
            const inboxPath = recipientRole === 'seller' ? '/seller/Inbox' : '/buyer/inbox';
            const notification = await this.notificationService.createNotification({
              userId: user._id.toString(), // user._id is ObjectId
              type: 'new_message',
              title: 'New Message',
              message: messagePreview,
              priority: 'normal',
              conversationId: conversationId,
              actionUrl: `${inboxPath}?conversationId=${conversationId}`,
              metadata: {
                conversationId,
                senderId: companyId,
                messagePreview,
              }
            });

            const unreadCount = await this.notificationService.getUnreadCount(user._id.toString());

            // Emit to the user (via company socket)
            // Note: We notify the company channel, which all users of that company listen to
            this.notifyCompany(receiverId, 'notification-created', {
              notification,
              unreadCount,
            });

            this.tradeGateway.emitNotificationCreated(user._id.toString(), {
              notification,
              unreadCount,
            });
          }
        }
      } catch (err) {
        console.error('Failed to create message notification:', err);
      }

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message via WebSocket:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MarkReadPayload,
  ) {
    try {
      const { conversationId, companyId } = payload;

      // Mark messages as read in database
      await this.inboxService.markMessagesAsRead(conversationId, companyId);

      // Broadcast read receipt to all users in the conversation
      const room = `conversation-${conversationId}`;
      this.server.to(room).emit('messages-marked-read', {
        conversationId,
        companyId,
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const { conversationId, companyId, isTyping } = payload;
    const room = `conversation-${conversationId}`;

    // Broadcast typing status to other users in the conversation (exclude sender)
    client.to(room).emit('user-typing', {
      conversationId,
      companyId,
      isTyping,
    });

    return { success: true };
  }

  // Helper method to check if a user is online
  isUserOnline(companyId: string): boolean {
    const sockets = this.connectedUsers.get(companyId);
    return sockets ? sockets.size > 0 : false;
  }

  // Emit a notification to a specific company (e.g., for new conversation)
  notifyCompany(companyId: string, event: string, data: any) {
    const sockets = this.connectedUsers.get(companyId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  private removeSocketFromActiveConversations(socketId: string): void {
    this.activeConversations.forEach((companyMap, conversationId) => {
      companyMap.forEach((socketIds, companyId) => {
        socketIds.delete(socketId);
        if (socketIds.size === 0) {
          companyMap.delete(companyId);
        }
      });

      if (companyMap.size === 0) {
        this.activeConversations.delete(conversationId);
      }
    });
  }
}
