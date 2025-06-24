import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {User} from './schemas/users.schema';
import { TypegooseModule } from 'nestjs-typegoose';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    TypegooseModule.forFeature([User])
  ]
})
export class UsersModule {}
