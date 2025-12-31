import { Controller, Post, Delete, Get, Body, Param, HttpException, HttpStatus, Res } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { Response } from 'express';
import { AuthService } from 'src/auth/auth.service';

@Controller('wishlist')
export class WishlistController {
    constructor(
        private readonly wishlistService: WishlistService,
        private readonly authService: AuthService
    ) { }


    @Post()
    async add(@Res() response: Response, @Body() body: { productId: string }): Promise<void> {
        const accountToken = response.req.signedCookies['account'];
        if (!accountToken) {
            response.status(401).send('No valid cookie found');
            return;
        }
        // Verify JWT token and extract user ID
        let userId: string;
        try {
            const decoded = this.authService.validateAccountToken(accountToken);
            userId = (decoded as any).userId;
        } catch (error) {
            response.status(HttpStatus.UNAUTHORIZED).send({
                statusCode: HttpStatus.UNAUTHORIZED,
                message: 'Invalid token',
            });
            return;
        }
        try {
            const item = await this.wishlistService.addToWishlist(userId, body.productId);
            response.json({ success: true, item });
        } catch (err) {
            response.status(400).json({ error: err.message });
        }
    }

    @Delete()
    async remove(@Res() response: Response, @Body() body: { productId: string }) {
        const accountToken = response.req.signedCookies['account'];
        if (!accountToken) {
            response.status(401).send('No valid cookie found');
            return;
        }
        let userId: string;
        try {
            const decoded = this.authService.validateAccountToken(accountToken);
            userId = (decoded as any).userId;
        } catch (error) {
            response.status(HttpStatus.UNAUTHORIZED).send({
                statusCode: HttpStatus.UNAUTHORIZED,
                message: 'Invalid token',
            });
            return;
        }
        try {
            const res = await this.wishlistService.removeFromWishlist(userId, body.productId);
            response.json({ success: true, ...res });
        } catch (err) {
            response.status(err.status || 400).json({ error: err.message });
        }
    }

    @Get()
    async getOwnWishlist(@Res() response: Response) {
        const accountToken = response.req.signedCookies['account'];
        if (!accountToken) {
            response.status(401).send('No valid cookie found');
            return;
        }
        let userId: string;
        try {
            const decoded = this.authService.validateAccountToken(accountToken);
            userId = (decoded as any).userId;
        } catch (error) {
            response.status(HttpStatus.UNAUTHORIZED).send({
                statusCode: HttpStatus.UNAUTHORIZED,
                message: 'Invalid token',
            });
            return;
        }
        try {
            const products = await this.wishlistService.getUserWishlist(userId);
            response.json(products);
        } catch (err) {
            response.status(400).json({ error: err.message });
        }
    }
}
