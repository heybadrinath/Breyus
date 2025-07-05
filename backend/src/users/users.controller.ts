import { Body, Controller, Post, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth.service';

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
}
