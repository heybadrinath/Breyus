import { Controller, Post, Get, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/users/user.schema';
import { Model } from 'mongoose';


@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        @InjectModel(User.name) private readonly userSchema: Model<User>
    ) { }

    @Get('validate-cookie')
    async validateCookie(@Res() response: Response): Promise<any> {
        const accountToken = response.req.signedCookies['account'];

        if (!accountToken) {
            return response.status(401).send('No valid cookie found');
        }

        try {
            const decodeToken = this.authService.validateAccountToken(accountToken);
            if (!decodeToken) {
                return response.status(401).send('Invalid or expired cookie');
            }
            const userId = (decodeToken as any).userId;
            if (!userId) {
                return response.status(401).send('Invalid or expired cookie');
            }
            const user = await this.userSchema.findById(userId).populate('company', 'role').lean();
            if (!user) {
                return response.status(401).send('User not found');
            }
            // Ensure company is populated and has a role property
            const company = user.company as { role?: string };
            return response.status(200).json({ valid: true, role: company?.role });
        } catch (error) {
            return response.status(401).send('Invalid or expired cookie');
        }
    }
}