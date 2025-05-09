import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { JwtService } from './jwt.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../../users/users.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    NestJwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-jwt-key-for-breyus-app',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  providers: [JwtService, JwtStrategy],
  exports: [JwtService, NestJwtModule],
})
export class JwtModule {} 