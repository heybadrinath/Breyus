import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { AnalyticsModule } from './analytics/analytics.module';
import { Analytics } from './analytics/entities/analytics.entity';
import { UserDetails } from './users/entities/user-details.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Ensures .env is accessible everywhere
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('NODE_ENV', 'development');
        const isProduction = nodeEnv === 'production';
        
        return {
          type: 'sqlite',
          database: configService.get('DB_PATH', 'breyus.sqlite'),
          entities: [User, UserDetails, Analytics],
          synchronize: !isProduction,
          logging: !isProduction,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    MailModule,
    UsersModule,
    AnalyticsModule
  ],
})
export class AppModule {}
