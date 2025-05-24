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
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TradeResponseDto } from './dto/trade.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: '/trades'
})
export class TradesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TradesGateway.name);
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract JWT token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without authentication token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.userId = payload.id;
      client.userRole = payload.role;

      // Track connected user - add type guard
      if (!client.userId) {
        this.logger.error(`No userId found in JWT payload for client ${client.id}`);
        client.disconnect();
        return;
      }

      if (!this.connectedUsers.has(client.userId)) {
        this.connectedUsers.set(client.userId, new Set());
      }
      this.connectedUsers.get(client.userId)!.add(client.id);

      // Join user to their personal room
      await client.join(`user:${client.userId}`);
      
      this.logger.log(`User ${client.userId} connected with socket ${client.id}`);
      
      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to trade notifications',
        userId: client.userId
      });

    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.connectedUsers.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(client.userId);
        }
      }
      this.logger.log(`User ${client.userId} disconnected (socket ${client.id})`);
    }
  }

  // Subscribe to trade updates for a specific user
  @SubscribeMessage('subscribe-to-trades')
  handleSubscribeToTrades(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) {
      client.emit('error', { message: 'Authentication required' });
      return;
    }

    client.join(`trades:${client.userId}`);
    this.logger.log(`User ${client.userId} subscribed to trade updates`);
    
    client.emit('subscription-confirmed', {
      message: 'Subscribed to trade updates',
      room: `trades:${client.userId}`
    });
  }

  // Unsubscribe from trade updates
  @SubscribeMessage('unsubscribe-from-trades')
  handleUnsubscribeFromTrades(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) {
      return;
    }

    client.leave(`trades:${client.userId}`);
    this.logger.log(`User ${client.userId} unsubscribed from trade updates`);
  }

  // Get online status of users
  @SubscribeMessage('get-online-users')
  handleGetOnlineUsers(@ConnectedSocket() client: AuthenticatedSocket) {
    const onlineUserIds = Array.from(this.connectedUsers.keys());
    client.emit('online-users', { users: onlineUserIds });
  }

  // Public methods for emitting events from services

  // Notify when a new trade request is created
  async notifyNewTradeRequest(sellerId: string, trade: TradeResponseDto) {
    this.logger.log(`Notifying seller ${sellerId} of new trade request ${trade.id}`);
    
    this.server.to(`user:${sellerId}`).emit('new-trade-request', {
      type: 'new_trade_request',
      trade,
      message: `New trade request from ${trade.buyer?.firstName} ${trade.buyer?.lastName}`,
      timestamp: new Date().toISOString()
    });

    // Also emit to trades room
    this.server.to(`trades:${sellerId}`).emit('trade-update', {
      type: 'new_trade_request',
      trade,
      timestamp: new Date().toISOString()
    });
  }

  // Notify when a trade status changes
  async notifyTradeStatusUpdate(buyerId: string, sellerId: string, trade: TradeResponseDto, action: string) {
    this.logger.log(`Notifying trade status update for trade ${trade.id}: ${action}`);

    const updateData = {
      type: 'trade_status_update',
      action,
      trade,
      timestamp: new Date().toISOString()
    };

    // Notify buyer
    this.server.to(`user:${buyerId}`).emit('trade-status-update', {
      ...updateData,
      message: this.getStatusMessage(action, 'buyer', trade)
    });

    // Notify seller
    this.server.to(`user:${sellerId}`).emit('trade-status-update', {
      ...updateData,
      message: this.getStatusMessage(action, 'seller', trade)
    });

    // Emit to both users' trade rooms
    this.server.to(`trades:${buyerId}`).emit('trade-update', updateData);
    this.server.to(`trades:${sellerId}`).emit('trade-update', updateData);
  }

  // Notify when a counter offer is made
  async notifyCounterOffer(buyerId: string, trade: TradeResponseDto) {
    this.logger.log(`Notifying buyer ${buyerId} of counter offer for trade ${trade.id}`);

    const notificationData = {
      type: 'counter_offer',
      trade,
      message: `Counter offer received: $${trade.counter_offer_price}`,
      timestamp: new Date().toISOString()
    };

    this.server.to(`user:${buyerId}`).emit('counter-offer', notificationData);
    this.server.to(`trades:${buyerId}`).emit('trade-update', notificationData);
  }

  // Notify when a trade expires
  async notifyTradeExpired(buyerId: string, sellerId: string, trade: TradeResponseDto) {
    this.logger.log(`Notifying trade expiration for trade ${trade.id}`);

    const expirationData = {
      type: 'trade_expired',
      trade,
      timestamp: new Date().toISOString()
    };

    // Notify buyer
    this.server.to(`user:${buyerId}`).emit('trade-expired', {
      ...expirationData,
      message: 'Your trade request has expired'
    });

    // Notify seller
    this.server.to(`user:${sellerId}`).emit('trade-expired', {
      ...expirationData,
      message: 'A trade request has expired'
    });

    // Emit to trade rooms
    this.server.to(`trades:${buyerId}`).emit('trade-update', expirationData);
    this.server.to(`trades:${sellerId}`).emit('trade-update', expirationData);
  }

  // Send urgent trade notifications
  async notifyUrgentTrade(sellerId: string, trade: TradeResponseDto) {
    this.logger.log(`Sending urgent trade notification to seller ${sellerId}`);

    this.server.to(`user:${sellerId}`).emit('urgent-trade', {
      type: 'urgent_trade',
      trade,
      message: '🚨 URGENT: New trade request requires immediate attention',
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast system announcements
  async broadcastSystemAnnouncement(message: string, userIds?: string[]) {
    this.logger.log(`Broadcasting system announcement: ${message}`);

    const announcementData = {
      type: 'system_announcement',
      message,
      timestamp: new Date().toISOString()
    };

    if (userIds && userIds.length > 0) {
      // Send to specific users
      userIds.forEach(userId => {
        this.server.to(`user:${userId}`).emit('system-announcement', announcementData);
      });
    } else {
      // Broadcast to all connected users
      this.server.emit('system-announcement', announcementData);
    }
  }

  // Get connection status
  getConnectionStats() {
    return {
      totalConnections: Array.from(this.connectedUsers.values()).reduce((total, sockets) => total + sockets.size, 0),
      uniqueUsers: this.connectedUsers.size,
      userConnections: Object.fromEntries(
        Array.from(this.connectedUsers.entries()).map(([userId, sockets]) => [userId, sockets.size])
      )
    };
  }

  // Private helper methods
  private getStatusMessage(action: string, userType: 'buyer' | 'seller', trade: TradeResponseDto): string {
    switch (action) {
      case 'accepted':
        return userType === 'buyer' 
          ? `Your trade request has been accepted! Final price: $${trade.final_price}`
          : `You have accepted the trade request from ${trade.buyer?.firstName}`;
      
      case 'rejected':
        return userType === 'buyer'
          ? `Your trade request has been rejected. Reason: ${trade.rejection_reason || 'No reason provided'}`
          : `You have rejected the trade request from ${trade.buyer?.firstName}`;
      
      case 'counter_offered':
        return userType === 'buyer'
          ? `Counter offer received: $${trade.counter_offer_price}`
          : `You made a counter offer: $${trade.counter_offer_price}`;
      
      default:
        return 'Trade status updated';
    }
  }
} 