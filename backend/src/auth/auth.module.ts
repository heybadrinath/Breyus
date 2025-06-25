import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'hy1aauXXxZ35M0Jy+ndo65uCuY0v5o8fPg2wdkHJXwc=',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '3600' }, // Token expiration (e.g., 1 hour)
    }),
    UsersModule,
  ],
  providers: [AuthService],
  exports: [AuthService], // Export AuthService to use in UsersService
})
export class AuthModule {}
