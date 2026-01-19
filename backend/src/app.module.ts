import { Module, Logger, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { AdminModule } from './admin/admin.module';
import { SystemModule } from './admin/system/system.module';
import { SuspendedUserMiddleware } from './common/middleware';
import { CommoditiesModule } from './commodities/commodities.module';
import { AIModule } from './ai/ai.module';
import { BlogModule } from './blog/blog.module';
import { User, UserSchema } from './users/user.schema';
import mongoose from 'mongoose';

// mongodb-memory-server is loaded dynamically only when needed (dev with USE_MEMORY_DB=true)
let mongoMemoryServer: any = null;
const logger = new Logger('MongoDB');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Bug #7-8 Fix: Global throttler configuration for rate limiting
    // Individual controllers can override these defaults using @Throttle() decorator
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,    // 1 second
        limit: 3,     // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000,   // 10 seconds
        limit: 20,    // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000,   // 1 minute
        limit: 100,   // 100 requests per minute
      },
    ]),
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
          // Dynamic import to avoid loading in production
          const { MongoMemoryServer } = await import('mongodb-memory-server');
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
    AdminModule,
    SystemModule,
    CommoditiesModule,
    AIModule,
    BlogModule,
    // Import User model for SuspendedUserMiddleware
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply SuspendedUserMiddleware to all routes except /admin/*
    // This blocks suspended users from accessing the main API
    consumer
      .apply(SuspendedUserMiddleware)
      .exclude(
        { path: 'admin/(.*)', method: RequestMethod.ALL },
        { path: 'login', method: RequestMethod.ALL },
        { path: 'login/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
