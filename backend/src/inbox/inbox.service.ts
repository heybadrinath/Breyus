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
    const receiverId = user.company;
    // Prevent self-conversation (compare as strings)
    if (String(senderId) === String(receiverId)) {
      throw new Error("You can't send a message to yourself");
    }
    // Prevent duplicate conversation for same product and participants
    const existing = await this.conversationModel.findOne({
      product: createConversationDto.product,
      participants: { $all: [senderId, receiverId], $size: 2 },
    });
    if (existing) {
      throw new Error(`Conversation already exists:${existing._id}`);
    }
    const participants = [senderId, receiverId];

    const conversation = (await this.conversationModel.create({ ...createConversationDto, participants }));
    return conversation._id as string;
  }

  async getConversationsByCompanyId(companyId: string): Promise<any[]> {
    const conversations = await this.conversationModel.aggregate([
      // 1. Match conversations where the company is a participant
      { $match: { participants: new Types.ObjectId(companyId) } },

      // 2. Lookup Product details
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },

      // 3. Lookup Participants details
      {
        $lookup: {
          from: 'companies',
          localField: 'participants',
          foreignField: '_id',
          as: 'participants'
        }
      },

      // 4. Lookup Unread Count (Count messages where readBy does NOT include companyId)
      {
        $lookup: {
          from: 'messages',
          let: { msgIds: '$messages' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', '$$msgIds'] },
                readBy: { $ne: new Types.ObjectId(companyId) }
              }
            },
            { $count: 'count' }
          ],
          as: 'unreadCountArr'
        }
      },

      // 5. Lookup Last Message (Get the single most recent message)
      {
        $lookup: {
          from: 'messages',
          let: { msgIds: '$messages' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$msgIds'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'lastMessageArr'
        }
      },

      // 6. Project/Format the result
      {
        $project: {
          _id: 1,
          productName: '$product.name',
          participants: {
            $map: {
              input: '$participants',
              as: 'p',
              in: {
                id: { $toString: '$$p._id' },
                companyName: '$$p.companyName' // Assuming 'companyName' field exists on Company
              }
            }
          },
          unreadCount: {
            $ifNull: [{ $arrayElemAt: ['$unreadCountArr.count', 0] }, 0]
          },
          lastMessageData: { $arrayElemAt: ['$lastMessageArr', 0] }
        }
      }
    ]).exec();


    return conversations.map(conv => {
      // Find the other participant's name
      const otherParticipant = conv.participants.find((p: any) => p.id !== companyId);
      const companyName = otherParticipant ? otherParticipant.companyName : '';

      return {
        id: conv._id.toString(),
        productName: conv.productName || '',
        companyName,
        participantNames: conv.participants.map((p: any) => p.companyName),
        companyIds: conv.participants.map((p: any) => p.id),
        unreadCount: conv.unreadCount,
        lastMessage: conv.lastMessageData ? conv.lastMessageData.text : null,
        lastMessageTime: conv.lastMessageData ? conv.lastMessageData.createdAt : null,
      };
    });
  }

  async getMessages(conversationId: string, companyId: string): Promise<any[]> {
    const conversation = await this.conversationModel.findById(conversationId)
      .populate({
        path: 'messages',
        options: { sort: { createdAt: 1 } },
        populate: [
          { path: 'sender', select: 'companyName _id' },
          { path: 'receiver', select: 'companyName _id' }
        ]
      })
      .populate({ path: 'participants', select: 'companyName _id' })
      .exec();
    if (!conversation) throw new NotFoundException('Conversation not found');
    // Only return messages where the company is a participant
    if (!conversation.participants.map((p: any) => p._id.toString()).includes(companyId)) {
      throw new NotFoundException('Not a participant');
    }
    // Return messages with sender/receiver info
    return (Array.isArray(conversation.messages) ? conversation.messages : []).filter((msg: any) => msg && msg.text !== undefined).map((msg: any) => ({
      _id: msg._id,
      text: msg.text,
      sender: msg.sender,
      receiver: msg.receiver,
      createdAt: (msg as any).createdAt || null,
      readBy: msg.readBy,
    }));
  }

  async sendMessage(conversationId: string, senderId: string, text: string): Promise<any> {
    const conversation = await this.conversationModel.findById(conversationId).populate('participants').exec();
    if (!conversation) throw new NotFoundException('Conversation not found');
    // Find the receiver (the other participant)
    const participants = conversation.participants.map((p: any) => p._id.toString());
    if (!participants.includes(senderId)) throw new NotFoundException('Sender not a participant');
    const receiverId = participants.find((id: string) => id !== senderId);
    if (!receiverId) throw new NotFoundException('Receiver not found');
    // Create message
    const message = await this.messageModel.create({
      text,
      sender: senderId,
      receiver: receiverId,
      readBy: [senderId], // sender has read their own message
    });
    // Add message to conversation
    conversation.messages.push(message._id as any);
    await conversation.save();
    return {
      _id: message._id,
      text: message.text,
      sender: message.sender,
      receiver: message.receiver,
      createdAt: (message as any).createdAt || null,
      readBy: message.readBy,
    };
  }

  async markMessagesAsRead(conversationId: string, companyId: string): Promise<void> {
    const conversation = await this.conversationModel.findById(conversationId).populate('messages').exec();
    if (!conversation) throw new NotFoundException('Conversation not found');
    // Only mark as read if company is a participant
    if (!conversation.participants.map((p: any) => p.toString()).includes(companyId)) {
      throw new NotFoundException('Not a participant');
    }
    // Update all messages in the conversation
    await this.messageModel.updateMany(
      { _id: { $in: conversation.messages }, readBy: { $ne: companyId } },
      { $addToSet: { readBy: companyId } }
    ).exec();
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    return this.userModel.find({ company: companyId }).exec();
  }
}
