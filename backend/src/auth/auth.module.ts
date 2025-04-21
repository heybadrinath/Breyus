import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { JwtModule } from './jwt/jwt.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    MailModule, 
    UsersModule, 
    JwtModule,
    PassportModule.register({ defaultStrategy: 'jwt' })
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
