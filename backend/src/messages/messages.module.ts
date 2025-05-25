import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages-gateway';
import { MessagesController } from './messages.controller';

@Module({
  controllers: [MessagesController],
  providers: [MessagesGateway, MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {} 