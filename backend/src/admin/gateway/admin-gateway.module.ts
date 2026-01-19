import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminGateway } from './admin.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: {
          expiresIn: configService.get<string>('ADMIN_SESSION_EXPIRY') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AdminGateway],
  exports: [AdminGateway],
})
export class AdminGatewayModule {}
