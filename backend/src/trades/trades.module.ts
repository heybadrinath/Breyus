import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TradesController } from './trades.controller';
import { TradesService } from './trades.service';
import { TradesGateway } from './trades.gateway';
import { Trade } from './entities/trade.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade, Product, User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
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