import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { User } from '../users/user.schema';
import * as cookie from 'cookie';
import * as cookieSignature from 'cookie-signature';

export interface WsAuthResult {
  userId: string;
  companyId: string;
  user: User;
}

/**
 * WebSocket Authentication Service
 * Validates socket connections using the same JWT cookie as HTTP endpoints
 *
 * Security: Prevents socket event spoofing by validating identity server-side
 * instead of trusting client-provided companyId in payloads
 */
@Injectable()
export class WsAuthService {
  private readonly logger = new Logger(WsAuthService.name);

  constructor(
    private readonly authService: AuthService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Validate a socket connection's authentication
   * Extracts and validates the signed JWT cookie from handshake headers
   *
   * @param socket - The Socket.io socket instance
   * @returns Auth result with userId, companyId, and user object, or null if invalid
   */
  async validateSocket(socket: Socket): Promise<WsAuthResult | null> {
    try {
      // 1. Get cookies from handshake headers
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        this.logger.warn(`Socket ${socket.id}: No cookies in handshake`);
        return null;
      }

      // 2. Parse cookies
      const cookies = cookie.parse(cookieHeader);

      // 3. Get the signed account cookie
      // Signed cookies have 's:' prefix in the value
      let accountToken = cookies['account'];
      if (!accountToken) {
        this.logger.warn(`Socket ${socket.id}: No account cookie found`);
        return null;
      }

      // 4. Unsign the cookie if it's signed (starts with 's:')
      const cookieSecret = process.env.COOKIE_SECRET;
      if (!cookieSecret) {
        this.logger.error('COOKIE_SECRET not configured');
        return null;
      }

      // The signed cookie value starts with 's:' and needs to be unsigned
      if (accountToken.startsWith('s:')) {
        const unsigned = cookieSignature.unsign(
          accountToken.slice(2),
          cookieSecret,
        );
        if (unsigned === false) {
          this.logger.warn(`Socket ${socket.id}: Invalid cookie signature`);
          return null;
        }
        accountToken = unsigned;
      }

      // 5. Validate the JWT token
      let payload: { userId: string; companyId: string };
      try {
        payload = this.authService.validateAccountToken(accountToken) as {
          userId: string;
          companyId: string;
        };
      } catch (error) {
        this.logger.warn(`Socket ${socket.id}: Invalid JWT - ${error.message}`);
        return null;
      }

      if (!payload.userId || !payload.companyId) {
        this.logger.warn(
          `Socket ${socket.id}: Missing userId or companyId in token`,
        );
        return null;
      }

      // 6. Verify user exists and is not suspended
      const user = await this.userModel.findById(payload.userId);
      if (!user) {
        this.logger.warn(
          `Socket ${socket.id}: User ${payload.userId} not found`,
        );
        return null;
      }

      if ((user as any).isSuspended) {
        this.logger.warn(
          `Socket ${socket.id}: User ${payload.userId} is suspended`,
        );
        return null;
      }

      this.logger.log(
        `Socket ${socket.id} authenticated: user=${payload.userId}, company=${payload.companyId}`,
      );

      return {
        userId: payload.userId,
        companyId: payload.companyId,
        user,
      };
    } catch (error) {
      this.logger.error(
        `Socket ${socket.id}: Authentication error - ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Get authenticated companyId from socket
   * Uses stored auth data from handleConnection
   *
   * @param socket - The authenticated socket
   * @returns The authenticated companyId or null
   */
  getCompanyId(socket: Socket): string | null {
    return socket.data?.companyId || null;
  }

  /**
   * Get authenticated userId from socket
   * Uses stored auth data from handleConnection
   *
   * @param socket - The authenticated socket
   * @returns The authenticated userId or null
   */
  getUserId(socket: Socket): string | null {
    return socket.data?.userId || null;
  }
}
