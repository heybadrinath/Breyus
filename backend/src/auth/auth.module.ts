import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from 'src/users/user.schema';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || '',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '3600' },
    }),
    UsersModule,
     MongooseModule.forFeature([{ name: User.name, schema: UserSchema}]),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
