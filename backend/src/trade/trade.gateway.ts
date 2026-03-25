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
import { Logger, Inject, forwardRef } from '@nestjs/common';
// SECURITY FIX: Import WsAuthService for proper authentication (Audit Bug #6)
import { WsAuthService } from '../inbox/ws-auth.service';

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];
const corsOrigin = corsOrigins.length > 0 ? corsOrigins : true;

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
    origin: corsOrigin,
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

  // SECURITY FIX: Constructor with WsAuthService injection (Audit Bug #6)
  constructor(
    @Inject(forwardRef(() => WsAuthService))
    private readonly wsAuthService: WsAuthService,
  ) {}

  /**
   * SECURITY FIX: Authenticate socket on connection (Audit Bug #6)
   * Validates JWT token from cookie/header and stores validated userId on socket.data
   */
  async handleConnection(client: Socket) {
    this.logger.log(`Trade client attempting connection: ${client.id}`);

    try {
      // Use WsAuthService to validate the socket connection
      const authResult = await this.wsAuthService.validateSocket(client);

      if (!authResult) {
        this.logger.warn(
          `Trade client ${client.id} authentication failed - no valid credentials`,
        );
        client.emit('error', { message: 'Authentication failed' });
        client.disconnect();
        return;
      }

      // Store validated user info on socket.data (trusted source)
      client.data.userId = authResult.userId;
      client.data.companyId = authResult.companyId;

      this.logger.log(
        `Trade client ${client.id} authenticated as user ${authResult.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Trade client ${client.id} authentication error: ${error.message}`,
      );
      client.emit('error', { message: 'Authentication error' });
      client.disconnect();
    }
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
   * SECURITY FIX: Now uses validated socket.data.userId instead of payload.userId (Audit Bug #6)
   */
  @SubscribeMessage('join-trade')
  handleJoinTrade(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinTradePayload,
  ) {
    // SECURITY FIX: Use authenticated userId from socket.data, NOT from payload (Audit Bug #6)
    // payload.userId is ignored to prevent impersonation attacks
    const userId = client.data.userId;
    const { tradeId } = payload;

    // Reject if not authenticated
    if (!userId) {
      this.logger.warn(
        `[join-trade] Unauthenticated socket ${client.id} attempted to join`,
      );
      return { success: false, error: 'Authentication required' };
    }

    this.logger.log(
      `[join-trade] User ${userId} joining with socket ${client.id}`,
    );

    // Track user connection
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)?.add(client.id);
    this.logger.log(
      `[join-trade] User ${userId} now has ${this.connectedUsers.get(userId)?.size} socket(s)`,
    );

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
   * Handle heartbeat ping from client
   * Responds with heartbeat-pong to confirm connection is alive
   */
  @SubscribeMessage('heartbeat-ping')
  handleHeartbeatPing(@ConnectedSocket() client: Socket) {
    // Simply respond with pong - no logging to avoid noise
    client.emit('heartbeat-pong');
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
  notifyTradeParties(
    buyerId: string,
    sellerId: string,
    event: string,
    data: any,
  ) {
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
  emitTradeUpdate(
    tradeId: string,
    buyerId: string,
    sellerId: string,
    data: any,
  ) {
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
  emitNegotiationUpdate(
    tradeId: string,
    buyerId: string,
    sellerId: string,
    data: any,
  ) {
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
  emitDocumentUploaded(
    tradeId: string,
    buyerId: string,
    sellerId: string,
    data: any,
  ) {
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
   * Issue #17 - Emit document signed event
   */
  emitDocumentSigned(
    tradeId: string,
    buyerId: string,
    sellerId: string,
    data: {
      documentType: string;
      signedBy: 'buyer' | 'seller';
      fullySigned?: boolean;
    },
  ) {
    const eventData = {
      tradeId,
      type: 'document-signed',
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.notifyUser(buyerId, 'document-signed', eventData);
    this.notifyUser(sellerId, 'document-signed', eventData);
    this.notifyTradeRoom(tradeId, 'document-signed', eventData);
  }

  /**
   * Issue #17 - Emit document verified event
   */
  emitDocumentVerified(
    tradeId: string,
    buyerId: string,
    sellerId: string,
    data: {
      documentType: string;
      verifiedBy: 'buyer' | 'seller';
      status: 'approved' | 'rejected';
    },
  ) {
    const eventData = {
      tradeId,
      type: 'document-verified',
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.notifyUser(buyerId, 'document-verified', eventData);
    this.notifyUser(sellerId, 'document-verified', eventData);
    this.notifyTradeRoom(tradeId, 'document-verified', eventData);
  }

  /**
   * Issue #17 - Emit phase advanced event
   */
  emitPhaseAdvanced(
    tradeId: string,
    buyerId: string,
    sellerId: string,
    data: {
      previousPhase: string;
      newPhase: string;
      advancedBy: 'buyer' | 'seller';
    },
  ) {
    const eventData = {
      tradeId,
      type: 'phase-advanced',
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.notifyUser(buyerId, 'phase-advanced', eventData);
    this.notifyUser(sellerId, 'phase-advanced', eventData);
    this.notifyTradeRoom(tradeId, 'phase-advanced', eventData);
  }

  /**
   * Issue #17 - Emit trade completed event
   */
  emitTradeCompleted(
    tradeId: string,
    buyerId: string,
    sellerId: string,
    data: {
      completedBy: 'buyer' | 'seller';
      completedAt: Date;
    },
  ) {
    const eventData = {
      tradeId,
      type: 'trade-completed',
      ...data,
      timestamp: new Date().toISOString(),
    };

    this.notifyUser(buyerId, 'trade-completed', eventData);
    this.notifyUser(sellerId, 'trade-completed', eventData);
    this.notifyTradeRoom(tradeId, 'trade-completed', eventData);
  }

  /**
   * Emit notification event to a specific user
   * Used when a new notification is created
   */
  emitNotificationCreated(
    userId: string,
    data: {
      notification: any;
      unreadCount: number;
      unreadCounts?: {
        total: number;
        messages: number;
        pr: number;
        po: number;
        spa: number;
        ongoing: number;
      };
    },
  ): void {
    this.logger.log(
      `Emitting notification-created to user ${userId}, type: ${data.notification?.type}`,
    );
    const sockets = this.connectedUsers.get(userId);
    this.logger.log(
      `User ${userId} has ${sockets?.size || 0} connected sockets`,
    );
    this.notifyUser(userId, 'notification-created', data);
  }
}
