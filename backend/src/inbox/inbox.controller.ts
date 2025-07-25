import { Controller, Post, Body, Res, HttpStatus, Get } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth.service';


@Controller('inbox')
export class InboxController {
    constructor(
        private readonly InboxService: InboxService,
        private readonly authService: AuthService
    ) { }


    @Post('/create-conversation')
    async createConversation(
        @Body() CreateConversationDto: CreateConversationDto,
        @Res() response: Response
    ): Promise<void> {
        const accountToken = response.req.signedCookies['account'];
        if (!accountToken) {
            response.status(HttpStatus.UNAUTHORIZED).send({
                statusCode: HttpStatus.UNAUTHORIZED,
                message: 'No valid cookie found',
            });
        }

        let senderCompanyId: string | undefined;
        try {
            const decoded = this.authService.validateAccountToken(accountToken);
            senderCompanyId = (decoded as any).companyId
        } catch (error) {
            response.status(HttpStatus.UNAUTHORIZED).send({
                statusCode: HttpStatus.UNAUTHORIZED,
                message: 'Invalid token',
            });
        }

        try {
            const conversationId = this.InboxService.createConversation(CreateConversationDto, senderCompanyId as string);
            response.status(HttpStatus.CREATED).send(conversationId);
        } catch (e) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Failed to Create Conversation" })
        }
    }

    @Get('/get-conversations')
    async getConversations(
        @Res() response: Response,
    ) {
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
            companyId = (decoded as any).companyId
        } catch (error) {
            response.status(HttpStatus.UNAUTHORIZED).send({
                statusCode: HttpStatus.UNAUTHORIZED,
                message: 'Invalid token',
            });
        }
        const result = await this.InboxService.getConversationsByCompanyId(companyId as string);
        response.status(HttpStatus.OK).send(result)
    }
}

