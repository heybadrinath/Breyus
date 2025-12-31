import { Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';

@Controller('notifications')
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly authService: AuthService,
    ) { }

    private getUserIdFromCookie(req: any): string {
        const accountToken = req.signedCookies['account'];
        if (!accountToken) {
            throw { status: HttpStatus.UNAUTHORIZED, message: 'No valid cookie found' };
        }
        return this.authService.verifyAccountToken(accountToken);
    }

    @Get()
    async getNotifications(@Res() response: Response, @Query() query: NotificationQueryDto) {
        try {
            const userId = this.getUserIdFromCookie(response.req);
            const result = await this.notificationService.getNotifications(userId, query);
            response.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: result });
        } catch (error) {
            const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            response.status(status).json({ statusCode: status, message: error.message });
        }
    }

    @Get('recent')
    async getRecentUnread(@Res() response: Response, @Query('limit') limit?: string) {
        try {
            const userId = this.getUserIdFromCookie(response.req);
            const parsedLimit = limit ? parseInt(limit, 10) : undefined;
            const notifications = await this.notificationService.getRecentUnread(
                userId,
                Number.isFinite(parsedLimit) ? parsedLimit : undefined
            );
            response.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: notifications });
        } catch (error) {
            const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            response.status(status).json({ statusCode: status, message: error.message });
        }
    }

    @Get('unread-count')
    async getUnreadCount(@Res() response: Response) {
        try {
            const userId = this.getUserIdFromCookie(response.req);
            const count = await this.notificationService.getUnreadCount(userId);
            response.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: { count } });
        } catch (error) {
            const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            response.status(status).json({ statusCode: status, message: error.message });
        }
    }

    @Put('mark-all-read')
    async markAllAsRead(@Res() response: Response) {
        try {
            const userId = this.getUserIdFromCookie(response.req);
            await this.notificationService.markAllAsRead(userId);
            response.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, message: 'All notifications marked as read' });
        } catch (error) {
            const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            response.status(status).json({ statusCode: status, message: error.message });
        }
    }

    @Put(':id/read')
    async markAsRead(@Res() response: Response, @Param('id') id: string) {
        try {
            const userId = this.getUserIdFromCookie(response.req);
            await this.notificationService.markAsRead(id, userId);
            response.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, message: 'Notification marked as read' });
        } catch (error) {
            const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            response.status(status).json({ statusCode: status, message: error.message });
        }
    }

    @Delete('read')
    async deleteReadNotifications(@Res() response: Response) {
        try {
            const userId = this.getUserIdFromCookie(response.req);
            await this.notificationService.deleteReadNotifications(userId);
            response.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, message: 'Read notifications deleted' });
        } catch (error) {
            const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            response.status(status).json({ statusCode: status, message: error.message });
        }
    }

    @Delete(':id')
    async deleteNotification(@Res() response: Response, @Param('id') id: string) {
        try {
            const userId = this.getUserIdFromCookie(response.req);
            await this.notificationService.deleteNotification(id, userId);
            response.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, message: 'Notification deleted' });
        } catch (error) {
            const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            response.status(status).json({ statusCode: status, message: error.message });
        }
    }
}
