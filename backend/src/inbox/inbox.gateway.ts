import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { InboxService } from './inbox.service';
import { NotificationService } from '../notification/notification.service';
import { TradeGateway } from '../trade/trade.gateway';
import { WsAuthService } from './ws-auth.service';

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];
const corsOrigin = corsOrigins.length > 0 ? corsOrigins : true;

// Payloads no longer need companyId - it comes from authenticated socket
interface JoinConversationPayload {
  conversationId: string;
  companyId?: string; // Deprecated: ignored, uses socket auth
}

interface SendMessagePayload {
  conversationId: string;
  companyId?: string; // Deprecated: ignored, uses socket auth
  text: string;
  replyTo?: string | null;
}

interface MarkReadPayload {
  conversationId: string;
  companyId?: string; // Deprecated: ignored, uses socket auth
}

interface TypingPayload {
  conversationId: string;
  companyId?: string; // Deprecated: ignored, uses socket auth
  isTyping: boolean;
}

interface EditMessagePayload {
  conversationId: string;
  companyId?: string; // Deprecated: ignored, uses socket auth
  messageId: string;
  text: string;
}

interface ReactionPayload {
  conversationId: string;
  companyId?: string; // Deprecated: ignored, uses socket auth
  messageId: string;
  emoji: string;
}

@WebSocketGateway({
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
  namespace: '/inbox',
})
export class InboxGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(InboxGateway.name);
  private connectedUsers: Map<string, Set<string>> = new Map(); // companyId -> Set of socketIds
  private activeConversations: Map<string, Map<string, Set<string>>> = new Map(); // conversationId -> companyId -> socketIds

  constructor(
    private readonly inboxService: InboxService,
    private readonly notificationService: NotificationService,
    private readonly tradeGateway: TradeGateway,
    private readonly wsAuthService: WsAuthService,
  ) {}

  /**
   * Authenticate socket connection using JWT cookie
   * Unauthenticated connections are immediately disconnected
   */
  async handleConnection(client: Socket) {
    this.logger.log(`Client attempting connection: ${client.id}`);

    // Authenticate the socket connection
    const auth = await this.wsAuthService.validateSocket(client);

    if (!auth) {
      this.logger.warn(`Client ${client.id} failed authentication - disconnecting`);
      client.emit('auth-error', { message: 'Authentication failed. Please log in again.' });
      client.disconnect(true);
      return;
    }

    // Store authenticated identity in socket data
    // This is the ONLY source of truth for user identity - never trust payload
    client.data.userId = auth.userId;
    client.data.companyId = auth.companyId;

    this.logger.log(`Client ${client.id} authenticated as user=${auth.userId}, company=${auth.companyId}`);
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
    // Use authenticated companyId from socket, NOT from payload
    const companyId = client.data.companyId;
    if (!companyId) {
      this.logger.warn(`Socket ${client.id} attempted join-conversation without auth`);
      return { success: false, error: 'Not authenticated' };
    }

    const { conversationId } = payload;
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

    this.logger.log(`Company ${companyId} joined room ${room}`);
    return { success: true, room };
  }

  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinConversationPayload,
  ) {
    // Use authenticated companyId from socket, NOT from payload
    const companyId = client.data.companyId;
    if (!companyId) {
      return { success: false, error: 'Not authenticated' };
    }

    const { conversationId } = payload;
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

    this.logger.log(`Client ${client.id} left room ${room}`);
    return { success: true };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    try {
      // Use authenticated companyId from socket, NOT from payload
      const companyId = client.data.companyId;
      if (!companyId) {
        return { success: false, error: 'Not authenticated' };
      }

      const { conversationId, text, replyTo } = payload;

      // Save message to database using authenticated companyId
      const message = await this.inboxService.sendMessage(
        conversationId,
        companyId,
        text,
        replyTo,
      );

      // Get receiver info for emission logic
      const receiverObj = message.receiver as any;
      const receiverId = receiverObj?._id?.toString() || receiverObj?.toString() || '';

      // Check if receiver is currently viewing this conversation
      const isReceiverActive = (this.activeConversations.get(conversationId)?.get(receiverId)?.size || 0) > 0;

      // Broadcast to all users in the conversation room
      const room = `conversation-${conversationId}`;
      this.server.to(room).emit('message-received', {
        conversationId,
        message,
      });

      // Also emit to receiver's sockets ONLY if they're not viewing this conversation
      // This ensures users on inbox page but viewing a different conversation get real-time updates
      // without causing duplicate events for users viewing this conversation
      if (!isReceiverActive) {
        const receiverSockets = this.connectedUsers.get(receiverId);
        if (receiverSockets && receiverSockets.size > 0) {
          console.log(`[InboxGateway] Receiver not active in conversation, emitting to ${receiverSockets.size} sockets for company ${receiverId}`);
          receiverSockets.forEach(socketId => {
            this.server.to(socketId).emit('message-received', {
              conversationId,
              message,
            });
          });
        }
      }

      // Send notification if receiver is not active in this conversation
      try {
        // Extract sender company name from populated message
        const senderObj = message.sender as any;
        const senderName = senderObj?.companyName || 'Someone';

        console.log(`[InboxGateway] receiverId: ${receiverId}, senderName: ${senderName}, isReceiverActive: ${isReceiverActive}`);

        if (!isReceiverActive) {
          console.log(`[InboxGateway] Receiver ${receiverId} is NOT active in conversation ${conversationId}, creating notification...`);
          // Get all users for the receiver company
          const users = await this.inboxService.getUsersByCompany(receiverId);
          console.log(`[InboxGateway] Found ${users.length} users for company ${receiverId}`);

          for (const user of users) {
            const messagePreview = text.length > 50 ? `${text.substring(0, 50)}...` : text;
            const recipientRole = user.role === 'Buyer' ? 'buyer' : 'seller';
            const inboxPath = recipientRole === 'seller' ? '/seller/Inbox' : '/buyer/inbox';
            const notification = await this.notificationService.createNotification({
              userId: user._id.toString(),
              type: 'new_message',
              title: `Message from ${senderName}`,
              message: messagePreview,
              priority: 'normal',
              conversationId: conversationId,
              actionUrl: `${inboxPath}?conversationId=${conversationId}`,
              metadata: {
                conversationId,
                senderId: companyId,
                senderName,
                messagePreview,
              }
            });
            console.log(`[InboxGateway] Created notification for user ${user._id.toString()}`);

            const unreadCount = await this.notificationService.getUnreadCount(user._id.toString());
            console.log(`[InboxGateway] User ${user._id.toString()} has ${unreadCount} unread notifications`);

            // Only emit via trade gateway (removed notifyCompany to avoid duplicate toasts)
            console.log(`[InboxGateway] Emitting notification via tradeGateway for user ${user._id.toString()}`);
            this.tradeGateway.emitNotificationCreated(user._id.toString(), {
              notification,
              unreadCount,
            });
          }
        } else {
          console.log(`[InboxGateway] Receiver ${receiverId} IS active in conversation ${conversationId}, skipping notification`);
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
      // Use authenticated companyId from socket, NOT from payload
      const companyId = client.data.companyId;
      if (!companyId) {
        return { success: false, error: 'Not authenticated' };
      }

      const { conversationId } = payload;

      // Mark messages as read in database using authenticated companyId
      await this.inboxService.markMessagesAsRead(conversationId, companyId);

      // Broadcast read receipt to all users in the conversation
      const room = `conversation-${conversationId}`;
      this.server.to(room).emit('messages-marked-read', {
        conversationId,
        companyId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    // Use authenticated companyId from socket, NOT from payload
    const companyId = client.data.companyId;
    if (!companyId) {
      return { success: false, error: 'Not authenticated' };
    }

    const { conversationId, isTyping } = payload;
    const room = `conversation-${conversationId}`;

    // Broadcast typing status to other users in the conversation (exclude sender)
    client.to(room).emit('user-typing', {
      conversationId,
      companyId,
      isTyping,
    });

    return { success: true };
  }

  @SubscribeMessage('edit-message')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: EditMessagePayload,
  ) {
    try {
      // Use authenticated companyId from socket, NOT from payload
      const companyId = client.data.companyId;
      if (!companyId) {
        return { success: false, error: 'Not authenticated' };
      }

      const { conversationId, messageId, text } = payload;
      const updatedMessage = await this.inboxService.editMessage(
        conversationId,
        messageId,
        companyId,
        text,
      );

      const room = `conversation-${conversationId}`;
      this.server.to(room).emit('message-updated', {
        conversationId,
        message: updatedMessage,
      });

      return { success: true, message: updatedMessage };
    } catch (error) {
      this.logger.error('Error editing message via WebSocket:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('toggle-reaction')
  async handleToggleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ReactionPayload,
  ) {
    try {
      // Use authenticated companyId from socket, NOT from payload
      const companyId = client.data.companyId;
      if (!companyId) {
        return { success: false, error: 'Not authenticated' };
      }

      const { conversationId, messageId, emoji } = payload;
      const updatedMessage = await this.inboxService.toggleReaction(
        conversationId,
        messageId,
        companyId,
        emoji,
      );

      const room = `conversation-${conversationId}`;
      this.server.to(room).emit('message-updated', {
        conversationId,
        message: updatedMessage,
      });

      return { success: true, message: updatedMessage };
    } catch (error) {
      this.logger.error('Error toggling reaction via WebSocket:', error);
      return { success: false, error: error.message };
    }
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
