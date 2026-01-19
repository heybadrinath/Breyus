import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AdminSocket extends Socket {
  adminId?: string;
  adminEmail?: string;
}

@WebSocketGateway({
  namespace: '/admin',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class AdminGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdminGateway.name);
  private connectedAdmins: Map<string, AdminSocket> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('Admin WebSocket Gateway initialized');
  }

  async handleConnection(client: AdminSocket) {
    try {
      // Get token from handshake auth or cookie
      const token =
        client.handshake.auth?.token ||
        this.extractTokenFromCookie(client.handshake.headers.cookie);

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.verifyAdminToken(token);
      if (!payload) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      // Store admin info on socket
      client.adminId = payload.sub;
      client.adminEmail = payload.email;

      // Add to connected admins
      this.connectedAdmins.set(client.id, client);

      // Join admin room
      client.join('admin-room');

      this.logger.log(`Admin connected: ${payload.email} (${client.id})`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to admin gateway',
        adminId: payload.sub,
      });

      // Broadcast updated admin count
      this.broadcastAdminCount();
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AdminSocket) {
    this.connectedAdmins.delete(client.id);
    this.logger.log(`Admin disconnected: ${client.adminEmail || client.id}`);
    this.broadcastAdminCount();
  }

  private extractTokenFromCookie(cookieHeader?: string): string | null {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    return cookies['admin_session'] || null;
  }

  private async verifyAdminToken(token: string): Promise<any> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET_KEY');
      return await this.jwtService.verifyAsync(token, { secret });
    } catch {
      return null;
    }
  }

  private broadcastAdminCount() {
    this.server.to('admin-room').emit('admin:count', {
      count: this.connectedAdmins.size,
    });
  }

  // ==================== SERVER-TO-CLIENT EVENTS ====================

  /**
   * Broadcast new activity to all connected admins
   */
  broadcastActivity(activity: {
    adminEmail: string;
    action: string;
    description: string;
    timestamp: Date;
    targetType?: string;
    targetId?: string;
  }) {
    this.server.to('admin-room').emit('activity:new', activity);
  }

  /**
   * Broadcast health status update
   */
  broadcastHealthUpdate(health: {
    overall: string;
    services: Record<string, { status: string }>;
    lastChecked: string;
  }) {
    this.server.to('admin-room').emit('health:update', health);
  }

  /**
   * Broadcast maintenance mode change
   */
  broadcastMaintenanceChange(maintenance: {
    isEnabled: boolean;
    message: string;
    estimatedEndTime?: Date;
  }) {
    this.server.to('admin-room').emit('maintenance:changed', maintenance);
  }

  /**
   * Broadcast dashboard stats update
   */
  broadcastStatsUpdate(stats: any) {
    this.server.to('admin-room').emit('stats:update', stats);
  }

  /**
   * Send log line to subscribed admins
   */
  sendLogLine(service: string, line: string) {
    this.server.to(`logs:${service}`).emit('logs:line', {
      service,
      line,
      timestamp: new Date().toISOString(),
    });
  }

  // ==================== CLIENT-TO-SERVER EVENTS ====================

  @SubscribeMessage('admin:join')
  handleAdminJoin(
    @ConnectedSocket() client: AdminSocket,
    @MessageBody() data: { adminId: string },
  ) {
    this.logger.log(`Admin joined: ${client.adminEmail}`);
    return { status: 'ok', message: 'Joined admin room' };
  }

  @SubscribeMessage('logs:subscribe')
  handleLogsSubscribe(
    @ConnectedSocket() client: AdminSocket,
    @MessageBody() data: { service: string },
  ) {
    client.join(`logs:${data.service}`);
    this.logger.log(`${client.adminEmail} subscribed to ${data.service} logs`);
    return { status: 'ok', message: `Subscribed to ${data.service} logs` };
  }

  @SubscribeMessage('logs:unsubscribe')
  handleLogsUnsubscribe(
    @ConnectedSocket() client: AdminSocket,
    @MessageBody() data: { service: string },
  ) {
    client.leave(`logs:${data.service}`);
    this.logger.log(`${client.adminEmail} unsubscribed from ${data.service} logs`);
    return { status: 'ok', message: `Unsubscribed from ${data.service} logs` };
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AdminSocket) {
    return { event: 'pong', timestamp: new Date().toISOString() };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get count of connected admins
   */
  getConnectedAdminCount(): number {
    return this.connectedAdmins.size;
  }

  /**
   * Get list of connected admin emails
   */
  getConnectedAdmins(): string[] {
    return Array.from(this.connectedAdmins.values())
      .map((socket) => socket.adminEmail)
      .filter((email): email is string => !!email);
  }

  /**
   * Send a notification to a specific admin
   */
  notifyAdmin(adminId: string, event: string, data: any) {
    for (const [, socket] of this.connectedAdmins) {
      if (socket.adminId === adminId) {
        socket.emit(event, data);
        break;
      }
    }
  }
}
