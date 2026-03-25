import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Product } from 'src/products/schema/products.schema';
import { Conversation } from './schemas/conversations.schema';
import { Company } from 'src/company/company.schema';
import { Message } from './schemas/messages.schema';
import { User } from 'src/users/user.schema';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class InboxService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,

    @InjectModel(Product.name) private productModel: Model<Product>,
    private readonly notificationService: NotificationService,
  ) {}

  private buildReplyReference(message: any) {
    const reply = message?.replyTo;
    if (!reply || typeof reply !== 'object' || !('text' in reply)) {
      return null;
    }
    return {
      _id: reply._id,
      text: reply.text,
      sender: reply.sender,
      createdAt: reply.createdAt || null,
    };
  }

  private formatMessage(message: any) {
    return {
      _id: message._id,
      text: message.text,
      sender: message.sender,
      receiver: message.receiver,
      createdAt: message.createdAt || null,
      editedAt: message.editedAt || null,
      readBy: message.readBy,
      reactions: message.reactions || [],
      replyTo: this.buildReplyReference(message),
    };
  }

  /**
   * Create a new conversation
   * Supports two modes:
   * 1. Product-based conversation (existing flow): requires 'product' field
   * 2. Direct company conversation (new): requires 'targetCompanyId' field
   */
  async createConversation(
    createConversationDto: CreateConversationDto,
    companyId: string,
  ): Promise<string> {
    const senderId = companyId;
    let receiverId: Types.ObjectId | string;
    let productId: string | undefined;

    // Mode 1: Product-based conversation (existing flow)
    if (createConversationDto.product) {
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

      receiverId = user.company;
      productId = createConversationDto.product;
    }
    // Mode 2: Direct company conversation
    else if (createConversationDto.targetCompanyId) {
      // Validate target company exists
      if (!Types.ObjectId.isValid(createConversationDto.targetCompanyId)) {
        throw new BadRequestException('Invalid target company ID format');
      }

      // Check if target company exists
      const targetCompanyObjectId = new Types.ObjectId(
        createConversationDto.targetCompanyId,
      );

      // Find a user from the target company to validate it exists
      const targetUser = await this.userModel
        .findOne({ company: targetCompanyObjectId })
        .exec();
      if (!targetUser) {
        throw new NotFoundException('Target company not found or has no users');
      }

      receiverId = targetCompanyObjectId;
    }
    // Neither product nor targetCompanyId provided
    else {
      throw new BadRequestException(
        'Either product or targetCompanyId must be provided',
      );
    }

    // Prevent self-conversation (compare as strings)
    if (String(senderId) === String(receiverId)) {
      throw new Error("You can't send a message to yourself");
    }

    // Prevent duplicate conversation for same participants
    // For product-based: check product + participants
    // For direct: check participants without product
    const existingQuery: any = {
      participants: { $all: [senderId, receiverId], $size: 2 },
    };

    if (productId) {
      existingQuery.product = productId;
    } else {
      // For direct conversations, look for any existing conversation between these parties
      // that doesn't have a product (or any conversation if we want to reuse)
      existingQuery.product = { $exists: false };
    }

    const existing = await this.conversationModel.findOne(existingQuery);
    if (existing) {
      // Return existing conversation ID instead of throwing error (idempotent behavior)
      return existing._id as string;
    }

    // For direct conversations without product, also check if there's any existing conversation
    // between the two companies (regardless of product) and return it
    if (!productId) {
      const anyExisting = await this.conversationModel.findOne({
        participants: { $all: [senderId, receiverId], $size: 2 },
      });
      if (anyExisting) {
        // Return existing conversation ID instead of throwing error (idempotent behavior)
        return anyExisting._id as string;
      }
    }

    const participants = [senderId, receiverId];

    // Create conversation data
    const conversationData: any = { participants };
    if (productId) {
      conversationData.product = productId;
    }

    const conversation = await this.conversationModel.create(conversationData);
    return conversation._id as string;
  }

  async getConversationsByCompanyId(companyId: string): Promise<any[]> {
    const companyObjectId = new Types.ObjectId(companyId);
    const conversations = await this.conversationModel
      .aggregate([
        // 1. Match conversations where the company is a participant
        { $match: { participants: companyObjectId } },

        // 2. Lookup Product details
        {
          $lookup: {
            from: 'products',
            localField: 'product',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },

        // 3. Lookup Participants details
        {
          $lookup: {
            from: 'companies',
            localField: 'participants',
            foreignField: '_id',
            as: 'participants',
          },
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
                  readBy: { $nin: [companyObjectId, companyId] },
                },
              },
              { $count: 'count' },
            ],
            as: 'unreadCountArr',
          },
        },

        // 5. Lookup Last Message (Get the single most recent message)
        {
          $lookup: {
            from: 'messages',
            let: { msgIds: '$messages' },
            pipeline: [
              { $match: { $expr: { $in: ['$_id', '$$msgIds'] } } },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: 'lastMessageArr',
          },
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
                  companyName: '$$p.companyName', // Assuming 'companyName' field exists on Company
                  profilePicture: '$$p.profilePicture', // Include profile picture for avatar display
                },
              },
            },
            unreadCount: {
              $ifNull: [{ $arrayElemAt: ['$unreadCountArr.count', 0] }, 0],
            },
            lastMessageData: { $arrayElemAt: ['$lastMessageArr', 0] },
          },
        },
      ])
      .exec();

    return conversations.map((conv) => {
      // Find the other participant's details
      const otherParticipant = conv.participants.find(
        (p: any) => p.id !== companyId,
      );
      const companyName = otherParticipant ? otherParticipant.companyName : '';
      const profilePicture = otherParticipant
        ? otherParticipant.profilePicture
        : null;

      return {
        id: conv._id.toString(),
        productName: conv.productName || '',
        companyName,
        profilePicture, // Profile picture of the other participant
        participantNames: conv.participants.map((p: any) => p.companyName),
        companyIds: conv.participants.map((p: any) => p.id),
        unreadCount: conv.unreadCount,
        lastMessage: conv.lastMessageData ? conv.lastMessageData.text : null,
        lastMessageTime: conv.lastMessageData
          ? conv.lastMessageData.createdAt
          : null,
      };
    });
  }

  async getMessages(conversationId: string, companyId: string): Promise<any[]> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .populate({
        path: 'messages',
        options: { sort: { createdAt: 1 } },
        populate: [
          { path: 'sender', select: 'companyName _id' },
          { path: 'receiver', select: 'companyName _id' },
          { path: 'reactions.user', select: 'companyName _id' },
          {
            path: 'replyTo',
            select: 'text sender createdAt',
            populate: { path: 'sender', select: 'companyName _id' },
          },
        ],
      })
      .populate({ path: 'participants', select: 'companyName _id' })
      .exec();
    if (!conversation) throw new NotFoundException('Conversation not found');
    // Only return messages where the company is a participant
    if (
      !conversation.participants
        .map((p: any) => p._id.toString())
        .includes(companyId)
    ) {
      throw new NotFoundException('Not a participant');
    }
    // Return messages with sender/receiver info
    return (Array.isArray(conversation.messages) ? conversation.messages : [])
      .filter((msg: any) => msg && msg.text !== undefined)
      .map((msg: any) => this.formatMessage(msg));
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
    replyToId?: string | null,
  ): Promise<any> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .populate('participants')
      .exec();
    if (!conversation) throw new NotFoundException('Conversation not found');
    // Find the receiver (the other participant)
    const participants = conversation.participants.map((p: any) =>
      p._id.toString(),
    );
    if (!participants.includes(senderId))
      throw new NotFoundException('Sender not a participant');
    const receiverId = participants.find((id: string) => id !== senderId);
    if (!receiverId) throw new NotFoundException('Receiver not found');
    const trimmedText = (text || '').trim();
    if (!trimmedText) {
      throw new NotFoundException('Message text cannot be empty');
    }
    let replyTo: Types.ObjectId | null = null;
    if (replyToId) {
      if (!Types.ObjectId.isValid(replyToId)) {
        throw new NotFoundException('Reply target not found');
      }
      const messageIds = (conversation.messages || []).map((msg: any) =>
        msg?._id ? msg._id.toString() : msg.toString(),
      );
      if (!messageIds.includes(replyToId)) {
        throw new NotFoundException('Reply target not found');
      }
      replyTo = new Types.ObjectId(replyToId);
    }
    // Create message
    const message = await this.messageModel.create({
      text: trimmedText,
      sender: senderId,
      receiver: receiverId,
      replyTo,
      readBy: [new Types.ObjectId(senderId)], // sender has read their own message
    });
    // Add message to conversation
    conversation.messages.push(message._id as any);
    await conversation.save();
    const populated = await this.messageModel
      .findById(message._id)
      .populate({ path: 'sender', select: 'companyName _id' })
      .populate({ path: 'receiver', select: 'companyName _id' })
      .populate({ path: 'reactions.user', select: 'companyName _id' })
      .populate({
        path: 'replyTo',
        select: 'text sender createdAt',
        populate: { path: 'sender', select: 'companyName _id' },
      })
      .exec();
    if (!populated) throw new NotFoundException('Message not found');
    return this.formatMessage(populated);
  }

  async editMessage(
    conversationId: string,
    messageId: string,
    companyId: string,
    text: string,
  ): Promise<any> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (
      !conversation.participants
        .map((p: any) => p.toString())
        .includes(companyId)
    ) {
      throw new NotFoundException('Not a participant');
    }
    const isInConversation = (conversation.messages || []).some(
      (id: any) => id.toString() === messageId,
    );
    if (!isInConversation)
      throw new NotFoundException('Message not found in conversation');

    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');
    if (message.sender.toString() !== companyId) {
      throw new NotFoundException('Not allowed to edit this message');
    }

    const trimmedText = (text || '').trim();
    if (!trimmedText) {
      throw new NotFoundException('Message text cannot be empty');
    }

    if (message.text !== trimmedText) {
      message.text = trimmedText;
      message.editedAt = new Date();
      message.editedBy = new Types.ObjectId(companyId);
      await message.save();
    }

    const populated = await this.messageModel
      .findById(messageId)
      .populate({ path: 'sender', select: 'companyName _id' })
      .populate({ path: 'receiver', select: 'companyName _id' })
      .populate({ path: 'reactions.user', select: 'companyName _id' })
      .populate({
        path: 'replyTo',
        select: 'text sender createdAt',
        populate: { path: 'sender', select: 'companyName _id' },
      })
      .exec();

    if (!populated) throw new NotFoundException('Message not found');

    return this.formatMessage(populated);
  }

  async toggleReaction(
    conversationId: string,
    messageId: string,
    companyId: string,
    emoji: string,
  ): Promise<any> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (
      !conversation.participants
        .map((p: any) => p.toString())
        .includes(companyId)
    ) {
      throw new NotFoundException('Not a participant');
    }
    const isInConversation = (conversation.messages || []).some(
      (id: any) => id.toString() === messageId,
    );
    if (!isInConversation)
      throw new NotFoundException('Message not found in conversation');

    const message = await this.messageModel.findById(messageId).exec();
    if (!message) throw new NotFoundException('Message not found');

    const normalizedEmoji = (emoji || '').trim();
    if (!normalizedEmoji) {
      throw new NotFoundException('Reaction emoji required');
    }

    const reactions = Array.isArray(message.reactions) ? message.reactions : [];
    const existingIndex = reactions.findIndex(
      (reaction: any) => reaction.user?.toString() === companyId,
    );

    if (existingIndex !== -1) {
      if (reactions[existingIndex].emoji === normalizedEmoji) {
        reactions.splice(existingIndex, 1);
      } else {
        reactions[existingIndex].emoji = normalizedEmoji;
        reactions[existingIndex].reactedAt = new Date();
      }
    } else {
      reactions.push({
        user: new Types.ObjectId(companyId),
        emoji: normalizedEmoji,
        reactedAt: new Date(),
      });
    }

    message.reactions = reactions as any;
    await message.save();

    const populated = await this.messageModel
      .findById(messageId)
      .populate({ path: 'sender', select: 'companyName _id' })
      .populate({ path: 'receiver', select: 'companyName _id' })
      .populate({ path: 'reactions.user', select: 'companyName _id' })
      .populate({
        path: 'replyTo',
        select: 'text sender createdAt',
        populate: { path: 'sender', select: 'companyName _id' },
      })
      .exec();

    if (!populated) throw new NotFoundException('Message not found');

    return this.formatMessage(populated);
  }

  async markMessagesAsRead(
    conversationId: string,
    companyId: string,
  ): Promise<void> {
    const companyObjectId = new Types.ObjectId(companyId);
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();
    if (!conversation) throw new NotFoundException('Conversation not found');
    // Only mark as read if company is a participant
    if (
      !conversation.participants
        .map((p: any) => p.toString())
        .includes(companyId)
    ) {
      throw new NotFoundException('Not a participant');
    }
    const messageIds = (conversation.messages || [])
      .map((msg: any) => msg?._id || msg)
      .filter(Boolean)
      .map((id: any) => new Types.ObjectId(id));
    if (messageIds.length > 0) {
      // Update all messages in the conversation
      await this.messageModel
        .updateMany(
          { _id: { $in: messageIds }, readBy: { $ne: companyObjectId } },
          { $addToSet: { readBy: companyObjectId } },
        )
        .exec();
    }

    // Convert companyId to ObjectId for the query
    const companyIdObj = Types.ObjectId.isValid(companyId)
      ? new Types.ObjectId(companyId)
      : null;
    if (!companyIdObj) {
      console.log(`[InboxService] Invalid companyId: ${companyId}`);
      return;
    }

    const users = await this.userModel
      .find({ company: companyIdObj })
      .select('_id')
      .exec();
    console.log(
      `[InboxService] markMessagesAsRead found ${users.length} users for company ${companyId}`,
    );

    if (users.length > 0) {
      await this.notificationService.markConversationNotificationsRead(
        users.map((user) => user._id.toString()),
        conversationId,
      );
      console.log(
        `[InboxService] Marked conversation notifications as read for ${users.length} users`,
      );
    }
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    console.log(
      `[InboxService] getUsersByCompany called with companyId: '${companyId}'`,
    );

    // Validate the companyId first
    if (!companyId || typeof companyId !== 'string') {
      console.error(`[InboxService] Invalid companyId: ${companyId}`);
      return [];
    }

    // Clean the companyId (remove any whitespace)
    const cleanCompanyId = companyId.trim();

    // Validate it's a valid ObjectId
    if (!Types.ObjectId.isValid(cleanCompanyId)) {
      console.error(
        `[InboxService] companyId is not a valid ObjectId: '${cleanCompanyId}'`,
      );
      return [];
    }

    // Query with ObjectId (most reliable approach)
    const companyObjectId = new Types.ObjectId(cleanCompanyId);
    console.log(
      `[InboxService] Querying for users with company ObjectId: ${companyObjectId}`,
    );

    const users = await this.userModel
      .find({ company: companyObjectId })
      .exec();
    console.log(
      `[InboxService] Found ${users.length} users for company ${cleanCompanyId}`,
    );

    if (users.length > 0) {
      users.forEach((u, i) => {
        console.log(`  User ${i}: _id=${u._id.toString()}, mail=${u.mail}`);
      });
    }

    return users;
  }
}
