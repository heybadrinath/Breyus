import { Injectable, Logger } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);

  constructor(private readonly nestJwtService: NestJwtService) {}

  generateToken(payload: Record<string, any>): string {
    this.logger.debug(`Generating token for user: ${payload.email}`);
    return this.nestJwtService.sign(payload);
  }

  verifyToken(token: string): any {
    try {
      this.logger.debug('Verifying token');
      return this.nestJwtService.verify(token);
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      return null;
    }
  }

  decodeToken(token: string): any {
    try {
      return this.nestJwtService.decode(token);
    } catch (error) {
      this.logger.warn(`Token decoding failed: ${error.message}`);
      return null;
    }
  }
} 