import { forwardRef, Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { AuthModule } from 'src/auth/auth.module';
import {MailModule} from 'src/mail/mail.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  forwardRef(() =>AuthModule),
  MailModule

],
  
})
export class UsersModule {}
