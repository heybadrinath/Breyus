import { Body, Controller, Get, Post, Put, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { NotificationPreferences } from './user.schema';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
    ) {}

    @Post('return-name')
    async returnName(@Res() response: Response): Promise<void> {
        try{
            const accountToken = response.req.signedCookies['account'];
            if (!accountToken) {
               response.status(401).send('No valid cookie found');
            }
            const userId = this.authService.verifyAccountToken(accountToken);
            const name = await this.usersService.returnName(userId);
            if (!name) {
                response.status(404).send('User not found');
                return;
            }
            response.status(200).json({ name });
        } catch (error) {
            response.status(500).send('Internal Server Error');
        }
    }

    @Get('notification-preferences')
    async getNotificationPreferences(@Res() response: Response): Promise<void> {
        try {
            const accountToken = response.req.signedCookies['account'];
            if (!accountToken) {
                response.status(401).json({
                    statusCode: 401,
                    message: 'No valid cookie found',
                });
                return;
            }

            const userId = this.authService.verifyAccountToken(accountToken);
            const preferences = await this.usersService.getNotificationPreferences(userId);

            response.status(200).json({
                statusCode: 200,
                message: 'Notification preferences retrieved successfully',
                data: preferences,
            });
        } catch (error) {
            response.status(500).json({
                statusCode: 500,
                message: error.message || 'Internal Server Error',
            });
        }
    }

    @Put('notification-preferences')
    async updateNotificationPreferences(
        @Body() preferences: NotificationPreferences,
        @Res() response: Response
    ): Promise<void> {
        try {
            const accountToken = response.req.signedCookies['account'];
            if (!accountToken) {
                response.status(401).json({
                    statusCode: 401,
                    message: 'No valid cookie found',
                });
                return;
            }

            const userId = this.authService.verifyAccountToken(accountToken);
            const updatedPreferences = await this.usersService.updateNotificationPreferences(
                userId,
                preferences
            );

            response.status(200).json({
                statusCode: 200,
                message: 'Notification preferences updated successfully',
                data: updatedPreferences,
            });
        } catch (error) {
            response.status(500).json({
                statusCode: 500,
                message: error.message || 'Internal Server Error',
            });
        }
    }
}
