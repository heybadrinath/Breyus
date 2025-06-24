import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';

// Custom extractor function to handle tokens with or without Bearer prefix
const customJwtExtractor = (req: Request): string | null => {
  let token: string | null = null;
  if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    // Check if token already has 'Bearer ' prefix
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7, authHeader.length);
    } else {
      token = authHeader; // Use the token as-is if no Bearer prefix
    }
  }
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: customJwtExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret',
      passReqToCallback: true,
    });
    this.logger.log('JWT Strategy initialized');
  }

  async validate(req: Request, payload: any) {
    this.logger.debug(`Validating JWT token: ${JSON.stringify(payload)}`);
    this.logger.debug(`Auth header: ${req.headers.authorization}`);
    
    try {
      // Validate payload and extract user ID
      if (!payload || !payload.userId) {
        this.logger.warn('Invalid JWT payload structure');
        throw new UnauthorizedException('Invalid token format');
      }
      
      const user = await this.usersService.findOne(payload.userId);
      
      if (!user) {
        this.logger.warn(`User not found for ID: ${payload.userId}`);
        throw new UnauthorizedException('User not found');
      }
      
      // Return user without sensitive data
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      };
    } catch (error) {
      this.logger.error(`JWT validation error: ${error.message}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }
} 