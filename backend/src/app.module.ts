import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Ensures .env is accessible everywhere
    }),
    AuthModule,
    MailModule,
  ],
})
export class AppModule {}
