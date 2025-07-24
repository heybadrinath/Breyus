import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Product } from 'src/products/schema/products.schema';
import { Conversation } from './schemas/conversations.schema';
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

  async getConversationsByCompanyId(companyId: string): Promise<Conversation[]> {
    return this.conversationModel
      .find({ participants: companyId })
      .populate('participants')
      .populate('messages')
      .exec();
  }
}
