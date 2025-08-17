import { Controller, Post, Get, Body, Param, Res, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { TradeService } from './trade.service';
import { CreateTradeDto } from './dto/create-trade.dto';

@Controller('trade')
export class TradeController {
    constructor(private readonly tradeService: TradeService) {}

    @Post('create')
    async createTrade(@Body() createTradeDto: CreateTradeDto, @Res() response: Response) {
        try {
            const accountToken = response.req.signedCookies['account'];

            if (!accountToken) {
                return response.status(401).json({
                    statusCode: 401,
                    message: 'No valid cookie found'
                });
            }

            const result = await this.tradeService.createTrade(createTradeDto, accountToken);
            return response.status(result.statusCode).json(result);
        } catch (error) {
            return response.status(error.status || 500).json({
                statusCode: error.status || 500,
                message: error.message || 'Internal server error'
            });
        }
    }

    @Get('user-trades')
    async getUserTrades(@Res() response: Response) {
        try {
            const accountToken = response.req.signedCookies['account'];

            if (!accountToken) {
                return response.status(401).json({
                    statusCode: 401,
                    message: 'No valid cookie found'
                });
            }

            const result = await this.tradeService.getUserTrades(accountToken);
            return response.status(result.statusCode).json(result);
        } catch (error) {
            return response.status(error.status || 500).json({
                statusCode: error.status || 500,
                message: error.message || 'Internal server error'
            });
        }
    }

    @Get('seller-trades')
    async getSellerTrades(@Res() response: Response) {
        try {
            const accountToken = response.req.signedCookies['account'];

            if (!accountToken) {
                return response.status(401).json({
                    statusCode: 401,
                    message: 'No valid cookie found'
                });
            }

            const result = await this.tradeService.getSellerTrades(accountToken);
            return response.status(result.statusCode).json(result);
        } catch (error) {
            return response.status(error.status || 500).json({
                statusCode: error.status || 500,
                message: error.message || 'Internal server error'
            });
        }
    }

    @Get(':id')
    async getTradeById(@Param('id') id: string, @Res() response: Response) {
        try {
            const accountToken = response.req.signedCookies['account'];

            if (!accountToken) {
                return response.status(401).json({
                    statusCode: 401,
                    message: 'No valid cookie found'
                });
            }

            const result = await this.tradeService.getTradeById(id, accountToken);
            return response.status(result.statusCode).json(result);
        } catch (error) {
            return response.status(error.status || 500).json({
                statusCode: error.status || 500,
                message: error.message || 'Internal server error'
            });
        }
    }
}
