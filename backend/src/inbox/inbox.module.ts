import { Module } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { InboxController } from './inbox.controller';
import { InboxGateway } from './inbox.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './schemas/conversations.schema';
import { Message, MessageSchema } from './schemas/messages.schema';
import { Product, ProductSchema } from 'src/products/schema/products.schema';
import { AuthModule } from 'src/auth/auth.module';
import { User, UserSchema } from 'src/users/user.schema';
import { NotificationModule } from '../notification/notification.module';
import { TradeModule } from '../trade/trade.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]),
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule,
    NotificationModule,
    TradeModule,

  ],
  providers: [InboxService, InboxGateway],
  controllers: [InboxController],
  exports: [InboxGateway]
})
export class InboxModule { }
