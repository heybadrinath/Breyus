import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Trade } from './schema/trade.schema';
import { CreateTradeDto } from './dto/create-trade.dto';
import { AuthService } from '../auth/auth.service';
import { Product } from '../products/schema/products.schema';

@Injectable()
export class TradeService {
    constructor(
        @InjectModel(Trade.name) private readonly tradeModel: Model<Trade>,
        @InjectModel(Product.name) private readonly productModel: Model<Product>,
        private readonly authService: AuthService
    ) {}

    async createTrade(createTradeDto: CreateTradeDto, accountToken: string) {
        try {
            // Validate user authentication
            const decodedToken = this.authService.validateAccountToken(accountToken);
            const buyerId = (decodedToken as any).userId;

            if (!buyerId) {
                throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
            }

            // Validate product exists and get seller information
            const product = await this.productModel.findById(createTradeDto.productId);
            if (!product) {
                throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
            }

            const sellerId = product.userId;

            // Create new trade
            const trade = new this.tradeModel({
                product: new Types.ObjectId(createTradeDto.productId),
                buyer: new Types.ObjectId(buyerId),
                seller: new Types.ObjectId(sellerId),
                quantity: createTradeDto.quantity,
                quantityUnit: createTradeDto.quantityUnit,
                buyerOfferedPrice: createTradeDto.buyerOfferedPrice,
                buyerIncoterms: createTradeDto.buyerIncoterms,
                buyerMessage: createTradeDto.buyerMessage,
                selectedAddress: createTradeDto.selectedAddress,
                buyerIndustryType: createTradeDto.buyerIndustryType,
                buyerMarketYears: createTradeDto.buyerMarketYears,
                marketCapture: createTradeDto.marketCapture,
                tradeYears: createTradeDto.tradeYears,
                productUsage: createTradeDto.productUsage,
                paymentMethod: createTradeDto.paymentMethod,
                tradeStatus: 'pending'
            });

            const savedTrade = await trade.save();

            return {
                statusCode: 201,
                message: 'Trade request created successfully',
                data: savedTrade
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to create trade request', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getUserTrades(accountToken: string) {
        try {
            // Validate user authentication
            const decodedToken = this.authService.validateAccountToken(accountToken);
            const userId = (decodedToken as any).userId;

            if (!userId) {
                throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
            }

            // Get trades where user is buyer
            const trades = await this.tradeModel.find({
                buyer: new Types.ObjectId(userId)
            })
            .populate('product', 'name price currency productImages')
            .populate('seller', 'mail')
            .populate('buyer', 'mail')
            .sort({ createdAt: -1 });

            return {
                statusCode: 200,
                message: 'Trades retrieved successfully',
                data: trades
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to retrieve trades', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getSellerTrades(accountToken: string) {
        try {
            // Validate user authentication
            const decodedToken = this.authService.validateAccountToken(accountToken);
            const userId = (decodedToken as any).userId;

            if (!userId) {
                throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
            }

            // Get trades where user is seller
            const trades = await this.tradeModel.find({
                seller: new Types.ObjectId(userId)
            })
            .populate('product', 'name price currency productImages')
            .populate('seller', 'mail')
            .populate('buyer', 'mail')
            .sort({ createdAt: -1 });

            return {
                statusCode: 200,
                message: 'Trades retrieved successfully',
                data: trades
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to retrieve trades', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTradeById(tradeId: string, accountToken: string) {
        try {
            // Validate user authentication
            const decodedToken = this.authService.validateAccountToken(accountToken);
            const userId = (decodedToken as any).userId;

            if (!userId) {
                throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
            }

            // Get trade by ID and ensure user has access
            const trade = await this.tradeModel.findOne({
                _id: new Types.ObjectId(tradeId),
                $or: [
                    { buyer: new Types.ObjectId(userId) },
                    { seller: new Types.ObjectId(userId) }
                ]
            })
            .populate('product', 'name price currency productImages description')
            .populate('seller', 'mail')
            .populate('buyer', 'mail');

            if (!trade) {
                throw new HttpException('Trade not found or access denied', HttpStatus.NOT_FOUND);
            }

            return {
                statusCode: 200,
                message: 'Trade retrieved successfully',
                data: trade
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to retrieve trade', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
