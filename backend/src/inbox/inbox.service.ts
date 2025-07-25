import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Product } from 'src/products/schema/products.schema';
import { Conversation } from './schemas/conversations.schema';
import { Company } from 'src/company/company.schema';
import { Message } from './schemas/messages.schema';
import { User } from 'src/users/user.schema';

@Injectable()
export class InboxService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,

    @InjectModel(Product.name) private productModel: Model<Product>,
  ) { }

  async createConversation(createConversationDto: CreateConversationDto, companyId: string): Promise<string> {
    const product = await this.productModel
      .findById(createConversationDto.product)
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const user = await this.userModel.findById(product.userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const senderId = companyId;
    const receiverId = (user.company as unknown as string)
          const participants = [senderId, receiverId];

    const conversation = (await this.conversationModel.create({...createConversationDto, participants}));
    return conversation._id as string;
  }

  async getConversationsByCompanyId(companyId: string): Promise<any[]> {
  const conversations = await this.conversationModel
    .find({ participants: companyId })
    .populate('product', 'name')
    .populate({
      path: 'participants',
      select: 'companyName',
    })
    .populate({
      path: 'messages',
      options: { sort: { createdAt: -1 } }, // get all messages, sorted
    })
    .exec();

  return conversations.map(conversation => {
    // Get company name of participant at index 1 (if exists and populated)
    const companyName =
      Array.isArray(conversation.participants) &&
      conversation.participants[1] &&
      typeof conversation.participants[1] === 'object' &&
      'companyName' in conversation.participants[1]
        ? conversation.participants[1].companyName
        : null;

    // Get product name
    const productName =
      conversation.product && typeof conversation.product === 'object' && 'name' in conversation.product
        ? conversation.product.name
        : null;

    // Calculate unread count (assuming messages have a readBy array of company IDs)
    const unreadCount = Array.isArray(conversation.messages)
      ? conversation.messages.filter(
          (msg: any) => !msg.readBy || !msg.readBy.includes(companyId)
        ).length
      : 0;

    return {
      productName,
      companyName,
      unreadCount,
      lastMessageTime: conversation.messages.length > 0 ? conversation.messages[0].createdAt : null,
      lastMessage: conversation.messages.length > 0 ? conversation.messages[0].text : null,
    };
  });
}
}
