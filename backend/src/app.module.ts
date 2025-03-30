import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Ensures .env is accessible everywhere
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get('DB_TYPE', 'sqlite');
        
        if (dbType === 'sqlite') {
          console.log('Using SQLite database');
          return {
            type: 'sqlite',
            database: 'breyus.sqlite',
            entities: [User],
            synchronize: true,
          };
        }
        
        console.log('Using PostgreSQL database');
        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: +configService.get<number>('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'postgres'),
          database: configService.get('DB_NAME', 'breyus'),
          entities: [User],
          synchronize: configService.get('NODE_ENV') !== 'production', // Auto-create database schema in development
          ssl: configService.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    AuthModule,
    MailModule,
    UsersModule,
  ],
})
export class AppModule {}
