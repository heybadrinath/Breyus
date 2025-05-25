import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TradesController } from './trades.controller';
import { TradesService } from './trades.service';
import { TradesGateway } from './trades.gateway';
import { Trade } from './entities/trade.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Trade, Product, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h') 
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(), // Required for @Cron decorators
  ],
  controllers: [TradesController],
  providers: [
    TradesService,
    {
      provide: TradesGateway,
      useClass: TradesGateway,
    },
  ],
  exports: [TradesService, TradesGateway],
})
export class TradesModule {} 