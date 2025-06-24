import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Use the built-in JWT authentication
    this.logger.debug('JWT Auth Guard: Validating authentication');
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // If there's an error or no user, throw an exception
    if (err || !user) {
      this.logger.warn(`Authentication failed: ${err?.message || 'No user found'}`);
      throw err || new UnauthorizedException('Authentication required');
    }
    
    this.logger.debug(`User authenticated: ${user.email}`);
    return user;
  }
} 