import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InboxService } from './inbox.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { AuthGuard } from 'src/auth/auth.guard';

/**
 * Inbox Controller
 * All routes are protected by AuthGuard which validates:
 * - Cookie-based JWT authentication
 * - User existence in database
 * - User is not suspended
 */
@Controller('inbox')
@UseGuards(AuthGuard)
export class InboxController {
  constructor(
    private readonly InboxService: InboxService,
    private readonly authService: AuthService,
  ) {}

  @Post('/create-conversation')
  async createConversation(
    @Body() CreateConversationDto: CreateConversationDto,
    @Res() response: Response,
  ): Promise<void> {
    const accountToken = response.req.signedCookies['account'];
    if (!accountToken) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No valid cookie found',
      });
      return;
    }

    let senderCompanyId: string | undefined;
    try {
      const decoded = this.authService.validateAccountToken(accountToken);
      senderCompanyId = (decoded as any).companyId;
    } catch (error) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      });
      return;
    }

    try {
      const conversationId = await this.InboxService.createConversation(
        CreateConversationDto,
        senderCompanyId as string,
      );
      response.status(HttpStatus.CREATED).send(conversationId);
    } catch (e: any) {
      response.status(HttpStatus.BAD_REQUEST).send({
        statusCode: HttpStatus.BAD_REQUEST,
        message: e.message || 'Failed to Create Conversation',
      });
    }
  }

  @Get('/get-conversations')
  async getConversations(@Res() response: Response) {
    const accountToken = response.req.signedCookies['account'];
    if (!accountToken) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No valid cookie found',
      });
    }

    let companyId: string | undefined;
    try {
      const decoded = this.authService.validateAccountToken(accountToken);
      companyId = (decoded as any).companyId;
    } catch (error) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      });
    }
    const result = await this.InboxService.getConversationsByCompanyId(
      companyId as string,
    );
    response.status(HttpStatus.OK).send(result);
  }

  @Get('/:conversationId/messages')
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Res() response: Response,
  ) {
    const accountToken = response.req.signedCookies['account'];
    if (!accountToken) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No valid cookie found',
      });
      return;
    }
    let companyId: string | undefined;
    try {
      const decoded = this.authService.validateAccountToken(accountToken);
      companyId = (decoded as any).companyId;
    } catch (error) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      });
      return;
    }
    if (!companyId) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No companyId found',
      });
      return;
    }
    const messages = await this.InboxService.getMessages(
      conversationId,
      companyId,
    );
    response.status(HttpStatus.OK).send(messages);
  }

  @Post('/:conversationId/send-message')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body('text') text: string,
    @Body('replyTo') replyTo: string | undefined,
    @Res() response: Response,
  ) {
    const accountToken = response.req.signedCookies['account'];
    if (!accountToken) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No valid cookie found',
      });
      return;
    }
    let senderCompanyId: string | undefined;
    try {
      const decoded = this.authService.validateAccountToken(accountToken);
      senderCompanyId = (decoded as any).companyId;
    } catch (error) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      });
      return;
    }
    if (!senderCompanyId) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No companyId found',
      });
      return;
    }
    try {
      const message = await this.InboxService.sendMessage(
        conversationId,
        senderCompanyId,
        text,
        replyTo,
      );
      response.status(HttpStatus.CREATED).send(message);
    } catch (e) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to send message',
      });
    }
  }

  @Post('/:conversationId/mark-read')
  async markMessagesAsRead(
    @Param('conversationId') conversationId: string,
    @Res() response: Response,
  ) {
    const accountToken = response.req.signedCookies['account'];
    if (!accountToken) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No valid cookie found',
      });
      return;
    }
    let companyId: string | undefined;
    try {
      const decoded = this.authService.validateAccountToken(accountToken);
      companyId = (decoded as any).companyId;
    } catch (error) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      });
      return;
    }
    if (!companyId) {
      response.status(HttpStatus.UNAUTHORIZED).send({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'No companyId found',
      });
      return;
    }
    try {
      await this.InboxService.markMessagesAsRead(conversationId, companyId);
      response.status(HttpStatus.OK).send({ success: true });
    } catch (e) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to mark messages as read',
      });
    }
  }
}
