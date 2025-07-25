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
    // Map participants to array of { id, companyName }
    const participants = Array.isArray(conversation.participants)
      ? conversation.participants.map((p: any) => ({
          id: p._id ? p._id.toString() : p.toString(),
          companyName: p.companyName || '',
        }))
      : [];

    // Find the other participant's name (not the current user)
    const otherParticipant = participants.find(p => p.id !== companyId);
    const companyName = otherParticipant ? otherParticipant.companyName : '';

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

    // Safely get last message time and text
    let lastMessageTime: string | null = null;
    let lastMessage: string | null = null;
    if (Array.isArray(conversation.messages) && conversation.messages.length > 0) {
      const firstMsg = conversation.messages[0];
      if (firstMsg && typeof firstMsg === 'object') {
        lastMessageTime = (firstMsg as any).createdAt ? String((firstMsg as any).createdAt) : null;
        lastMessage = (firstMsg as any).text ? String((firstMsg as any).text) : null;
      }
    }

    return {
      productName,
      companyName,
      unreadCount,
      lastMessageTime,
      lastMessage,
      id: conversation._id,
      companyIds: participants.map(p => p.id),
      participantNames: participants.map(p => p.companyName),
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
}
