import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';

export interface CreateConversationDto {
  participantId: string;
}

export interface SendMessageDto {
  receiverId: string;
  content: string;
  type?: 'text' | 'image' | 'file';
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  async getConversations(@Request() req: any) {
    try {
      const userId = req.user.id;
      const conversations = this.messagesService.getUserConversations(userId);
      return conversations;
    } catch (error) {
      throw new Error('Failed to fetch conversations');
    }
  }

  @Post('conversations/start')
  async startConversation(
    @Body() createConversationDto: CreateConversationDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user.id;
      const { participantId } = createConversationDto;
      
      const conversation = this.messagesService.startConversation(userId, participantId);
      return conversation;
    } catch (error) {
      throw new Error('Failed to start conversation');
    }
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Request() req: any,
  ) {
    try {
      const userId = req.user.id;
      const messages = this.messagesService.getConversationMessages(
        conversationId,
        userId,
        parseInt(page),
        parseInt(limit),
      );
      return { messages };
    } catch (error) {
      throw new Error('Failed to fetch messages');
    }
  }

  @Post('send')
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Request() req: any,
  ) {
    try {
      const senderId = req.user.id;
      const { receiverId, content, type = 'text' } = sendMessageDto;
      
      const message = this.messagesService.sendMessage(senderId, receiverId, content, type);
      return message;
    } catch (error) {
      throw new Error('Failed to send message');
    }
  }

  @Put('conversations/:conversationId/read')
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
  ) {
    try {
      const userId = req.user.id;
      this.messagesService.markConversationAsRead(conversationId, userId);
      return { success: true };
    } catch (error) {
      throw new Error('Failed to mark messages as read');
    }
  }

  @Get('conversations/search')
  async searchConversations(
    @Query('q') query: string,
    @Request() req: any,
  ) {
    try {
      const userId = req.user.id;
      const conversations = this.messagesService.searchUserConversations(userId, query);
      return conversations;
    } catch (error) {
      throw new Error('Failed to search conversations');
    }
  }

  @Delete('conversations/:conversationId')
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @Request() req: any,
  ) {
    try {
      const userId = req.user.id;
      this.messagesService.deleteConversation(conversationId, userId);
      return { success: true };
    } catch (error) {
      throw new Error('Failed to delete conversation');
    }
  }
} 