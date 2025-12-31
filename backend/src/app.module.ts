import { Module, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { CompanyModule } from './company/company.module';
import { MailModule } from './mail/mail.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { LoginModule } from './login/login.module';
import { ProductsModule } from './products/products.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { InboxModule } from './inbox/inbox.module';
import { TradeModule } from './trade/trade.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FeedbackModule } from './feedback/feedback.module';
import { NotificationModule } from './notification/notification.module';
import { StorageModule } from './common/storage';
import { DocsModule } from './docs/docs.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoMemoryServer: MongoMemoryServer | null = null;
const logger = new Logger('MongoDB');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV');

        // Set up connection event listeners
        mongoose.connection.on('connected', () => {
          logger.log('MongoDB connected successfully');
        });
        mongoose.connection.on('error', (err) => {
          logger.error(`MongoDB connection error: ${err.message}`);
        });
        mongoose.connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected');
        });

        if (nodeEnv === 'production') {
          return {
            uri: configService.get<string>('MONGODB_URI_PROD'),
          };
        }

        const devUri = configService.get<string>('MONGODB_URI_DEV');

        if (configService.get<string>('USE_MEMORY_DB') === 'true') {
          logger.log('Starting in-memory MongoDB...');
          mongoMemoryServer = await MongoMemoryServer.create();
          const uri = mongoMemoryServer.getUri();
          return { uri };
        }

        return { uri: devUri };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CompanyModule,
    MailModule,
    OnboardingModule,
    LoginModule,
    ProductsModule,
    WishlistModule,
    InboxModule,
    TradeModule,
    AnalyticsModule,
    FeedbackModule,
    NotificationModule,
    StorageModule,
    DocsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { }
