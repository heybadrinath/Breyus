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
import { Logger } from '@nestjs/common';

interface JoinTradePayload {
  userId: string;
  tradeId?: string;
}

interface LeaveTradePayload {
  tradeId: string;
}

/**
 * Trade WebSocket Gateway
 * Handles real-time trade notifications on '/trade' namespace
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/trade',
})
export class TradeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TradeGateway.name);

  @WebSocketServer()
  server: Server;

  // Track connected users: userId -> Set of socketIds
  private connectedUsers: Map<string, Set<string>> = new Map();

  // Track trade subscriptions: tradeId -> Set of socketIds
  private tradeSubscriptions: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Trade client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Trade client disconnected: ${client.id}`);

    // Remove socket from all tracked users
    this.connectedUsers.forEach((sockets, userId) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    });

    // Remove socket from all trade subscriptions
    this.tradeSubscriptions.forEach((sockets, tradeId) => {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.tradeSubscriptions.delete(tradeId);
      }
    });
  }

  /**
   * Join trade notifications - register user connection
   */
  @SubscribeMessage('join-trade')
  handleJoinTrade(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinTradePayload,
  ) {
    const { userId, tradeId } = payload;

    // Track user connection
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)?.add(client.id);

    // If specific trade ID provided, subscribe to that trade's room
    if (tradeId) {
      const room = `trade-${tradeId}`;
      client.join(room);

      if (!this.tradeSubscriptions.has(tradeId)) {
        this.tradeSubscriptions.set(tradeId, new Set());
      }
      this.tradeSubscriptions.get(tradeId)?.add(client.id);

      this.logger.log(`User ${userId} joined trade room ${room}`);
    }

    this.logger.log(`User ${userId} connected for trade notifications`);
    return { success: true, userId, tradeId };
  }

  /**
   * Leave a specific trade room
   */
  @SubscribeMessage('leave-trade')
  handleLeaveTrade(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveTradePayload,
  ) {
    const { tradeId } = payload;
    const room = `trade-${tradeId}`;
    client.leave(room);

    // Remove from subscriptions
    this.tradeSubscriptions.get(tradeId)?.delete(client.id);
    if (this.tradeSubscriptions.get(tradeId)?.size === 0) {
      this.tradeSubscriptions.delete(tradeId);
    }

    this.logger.log(`Client ${client.id} left trade room ${room}`);
    return { success: true };
  }

  /**
   * Check if a user is currently online
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.connectedUsers.get(userId);
    return sockets ? sockets.size > 0 : false;
  }

  /**
   * Notify a specific user by their userId
   */
  notifyUser(userId: string, event: string, data: any) {
    const sockets = this.connectedUsers.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
      this.logger.debug(`Notified user ${userId} with event ${event}`);
    }
  }

  /**
   * Notify both parties in a trade
   */
  notifyTradeParties(buyerId: string, sellerId: string, event: string, data: any) {
    this.notifyUser(buyerId, event, data);
    this.notifyUser(sellerId, event, data);
  }

  /**
   * Notify all subscribers to a specific trade
   */
  notifyTradeRoom(tradeId: string, event: string, data: any) {
    const room = `trade-${tradeId}`;
    this.server.to(room).emit(event, data);
    this.logger.debug(`Notified trade room ${room} with event ${event}`);
  }

  /**
   * Emit trade update event
   */
  emitTradeUpdate(tradeId: string, buyerId: string, sellerId: string, data: any) {
    const eventData = {
      tradeId,
      ...data,
      timestamp: new Date().toISOString(),
    };

    // Notify trade room
    this.notifyTradeRoom(tradeId, 'trade-update', eventData);

    // Also notify users directly in case they're not in the room
    this.notifyUser(buyerId, 'trade-update', eventData);
    this.notifyUser(sellerId, 'trade-update', eventData);
  }

  /**
   * Emit negotiation update event
   */
  emitNegotiationUpdate(tradeId: string, buyerId: string, sellerId: string, data: any) {
    const eventData = {
      tradeId,
      type: 'negotiation',
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.notifyUser(buyerId, 'negotiation-update', eventData);
    this.notifyUser(sellerId, 'negotiation-update', eventData);
  }

  /**
   * Emit document uploaded event
   */
  emitDocumentUploaded(tradeId: string, buyerId: string, sellerId: string, data: any) {
    const eventData = {
      tradeId,
      type: 'document',
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.notifyUser(buyerId, 'document-uploaded', eventData);
    this.notifyUser(sellerId, 'document-uploaded', eventData);
  }

  /**
   * Emit notification event to a specific user
   * Used when a new notification is created
   */
  emitNotificationCreated(userId: string, data: {
    notification: any;
    unreadCount: number;
  }): void {
    this.notifyUser(userId, 'notification-created', data);
  }
}
