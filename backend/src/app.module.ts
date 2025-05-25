import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { AnalyticsModule } from './analytics/analytics.module';
import { StoreVisit } from './analytics/entities/store-visit.entity';
import { AnalyticsSale } from './analytics/entities/sale.entity';
import { Task } from './analytics/entities/task.entity';
import { UserDetails } from './users/entities/user-details.entity';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { SecurityModule } from './security/security.module';
import { Product } from './products/entities/product.entity';
import { Sale } from './sales/entities/sale.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesModule } from './messages/messages.module';
import { FeedbackModule } from './feedback/feedback.module';
import { TradesModule } from './trades/trades.module';
import { Trade } from './trades/entities/trade.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('NODE_ENV', 'development');
        const isProduction = nodeEnv === 'production';
        
        return {
          type: 'sqlite',
          database: configService.get('DB_PATH', 'breyus.sqlite'),
          entities: [
            User, 
            UserDetails, 
            Product, 
            Sale,
            StoreVisit,
            AnalyticsSale,
            Task,
            Trade
          ],
          synchronize: !isProduction,
          logging: !isProduction,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    MailModule,
    UsersModule,
    AnalyticsModule,
    ProductsModule,
    SalesModule,
    SecurityModule,
    MessagesModule,
    FeedbackModule,
    TradesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
