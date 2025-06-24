import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    UsersModule,
    AuthModule
  ],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService]
})
export class SecurityModule {} 