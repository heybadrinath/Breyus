import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Trade, TradeStatus, TradeType } from './entities/trade.entity';
import { Product } from '../products/entities/product.entity';
import { CreateTradeRequestDto, UpdateTradeStatusDto, CounterOfferDto, TradeResponseDto, TradeFilterDto } from './dto/trade.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TradesGateway } from './trades.gateway';

@Injectable()
export class TradesService {
  private readonly logger = new Logger(TradesService.name);

  constructor(
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @Inject(forwardRef(() => TradesGateway))
    private tradesGateway: TradesGateway,
  ) {}

  // Create a new trade request
  async createTradeRequest(buyerId: string, createTradeDto: CreateTradeRequestDto): Promise<TradeResponseDto> {
    this.logger.log(`Creating trade request from buyer ${buyerId} for product ${createTradeDto.product_id}`);

    // Validate product exists and belongs to the seller
    const product = await this.productRepository.findOne({
      where: { id: createTradeDto.product_id, sellerId: createTradeDto.seller_id }
    });

    if (!product) {
      throw new NotFoundException('Product not found or does not belong to the specified seller');
    }

    // Validate inventory
    if (product.quantity < createTradeDto.quantity) {
      throw new BadRequestException(`Insufficient inventory. Available: ${product.quantity}, Requested: ${createTradeDto.quantity}`);
    }

    // Create expiration date (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const trade = this.tradeRepository.create({
      buyer_id: buyerId,
      seller_id: createTradeDto.seller_id,
      product_id: createTradeDto.product_id,
      offered_price: createTradeDto.offered_price,
      quantity: createTradeDto.quantity,
      buyer_message: createTradeDto.buyer_message,
      trade_type: createTradeDto.trade_type || TradeType.PURCHASE_REQUEST,
      trade_terms: createTradeDto.trade_terms,
      shipping_details: createTradeDto.shipping_details,
      is_urgent: createTradeDto.is_urgent || false,
      expires_at: expiresAt,
      status: TradeStatus.PENDING,
    });

    const savedTrade = await this.tradeRepository.save(trade);
    const tradeResponse = this.mapToResponseDto(savedTrade);

    // Send real-time notifications
    try {
      if (createTradeDto.is_urgent) {
        await this.tradesGateway.notifyUrgentTrade(createTradeDto.seller_id, tradeResponse);
      } else {
        await this.tradesGateway.notifyNewTradeRequest(createTradeDto.seller_id, tradeResponse);
      }
    } catch (error) {
      this.logger.error(`Failed to send trade notification: ${error.message}`);
      // Don't fail the request if notification fails
    }

    return tradeResponse;
  }

  // Get incoming trade requests for a seller
  async getIncomingTrades(sellerId: string, filters: TradeFilterDto): Promise<{ trades: TradeResponseDto[], total: number, page: number, totalPages: number }> {
    this.logger.log(`Fetching incoming trades for seller ${sellerId}`);
    this.logger.log(`Raw filters received: ${JSON.stringify(filters)}`);

    const queryBuilder = this.tradeRepository
      .createQueryBuilder('trade')
      .leftJoinAndSelect('trade.buyer', 'buyer')
      .leftJoinAndSelect('trade.product', 'product')
      .where('trade.seller_id = :sellerId', { sellerId });

    // Apply filters
    this.applyFilters(queryBuilder, filters);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and sorting with proper defaults
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const sort_by = filters.sort_by || 'created_at';
    const sort_order = filters.sort_order || 'DESC';
    
    this.logger.log(`Pagination: page=${page}, limit=${limit}, sort_by=${sort_by}, sort_order=${sort_order}`);
    
    const skip = (page - 1) * limit;

    queryBuilder
      .orderBy(`trade.${sort_by}`, sort_order)
      .skip(skip)
      .take(limit);

    const trades = await queryBuilder.getMany();
    const totalPages = Math.ceil(total / limit);

    this.logger.log(`Found ${trades.length} trades out of ${total} total`);

    return {
      trades: trades.map(trade => this.mapToResponseDto(trade)),
      total,
      page,
      totalPages
    };
  }

  // Accept a trade request
  async acceptTrade(tradeId: string, sellerId: string, message?: string): Promise<TradeResponseDto> {
    this.logger.log(`Accepting trade ${tradeId} by seller ${sellerId}`);

    const trade = await this.findTradeForSeller(tradeId, sellerId);

    if (trade.status !== TradeStatus.PENDING && trade.status !== TradeStatus.COUNTER_OFFERED) {
      throw new BadRequestException('Trade is not in a state that can be accepted');
    }

    // Check if trade has expired
    if (trade.expires_at && new Date() > trade.expires_at) {
      await this.tradeRepository.update(trade.id, { status: TradeStatus.EXPIRED });
      throw new BadRequestException('Trade request has expired');
    }

    // Validate inventory is still available
    const product = await this.productRepository.findOne({
      where: { id: trade.product_id }
    });

    if (!product || product.quantity < trade.quantity) {
      throw new BadRequestException('Insufficient inventory to fulfill this trade');
    }

    // Update trade status
    trade.status = TradeStatus.ACCEPTED;
    trade.accepted_at = new Date();
    trade.seller_message = message || null;
    trade.final_price = trade.counter_offer_price || trade.offered_price;

    const updatedTrade = await this.tradeRepository.save(trade);
    const tradeResponse = this.mapToResponseDto(updatedTrade);

    // Send real-time notifications
    try {
      await this.tradesGateway.notifyTradeStatusUpdate(
        trade.buyer_id,
        trade.seller_id,
        tradeResponse,
        'accepted'
      );
    } catch (error) {
      this.logger.error(`Failed to send acceptance notification: ${error.message}`);
    }

    // TODO: Reserve inventory, send notifications
    
    return tradeResponse;
  }

  // Reject a trade request
  async rejectTrade(tradeId: string, sellerId: string, rejectionReason?: string): Promise<TradeResponseDto> {
    this.logger.log(`Rejecting trade ${tradeId} by seller ${sellerId}`);

    const trade = await this.findTradeForSeller(tradeId, sellerId);

    if (trade.status !== TradeStatus.PENDING && trade.status !== TradeStatus.COUNTER_OFFERED) {
      throw new BadRequestException('Trade is not in a state that can be rejected');
    }

    trade.status = TradeStatus.REJECTED;
    trade.rejection_reason = rejectionReason || null;

    const updatedTrade = await this.tradeRepository.save(trade);
    const tradeResponse = this.mapToResponseDto(updatedTrade);

    // Send real-time notifications
    try {
      await this.tradesGateway.notifyTradeStatusUpdate(
        trade.buyer_id,
        trade.seller_id,
        tradeResponse,
        'rejected'
      );
    } catch (error) {
      this.logger.error(`Failed to send rejection notification: ${error.message}`);
    }

    return tradeResponse;
  }

  // Make a counter offer
  async makeCounterOffer(tradeId: string, sellerId: string, counterOfferDto: CounterOfferDto): Promise<TradeResponseDto> {
    this.logger.log(`Making counter offer for trade ${tradeId} by seller ${sellerId}`);

    const trade = await this.findTradeForSeller(tradeId, sellerId);

    if (trade.status !== TradeStatus.PENDING) {
      throw new BadRequestException('Trade is not in a state that allows counter offers');
    }

    if (trade.counter_offer_count >= 3) {
      throw new BadRequestException('Maximum number of counter offers reached');
    }

    trade.status = TradeStatus.COUNTER_OFFERED;
    trade.counter_offer_price = counterOfferDto.counter_offer_price;
    trade.seller_message = counterOfferDto.seller_message || null;
    trade.trade_terms = counterOfferDto.trade_terms || trade.trade_terms;
    trade.counter_offer_count += 1;

    const updatedTrade = await this.tradeRepository.save(trade);
    const tradeResponse = this.mapToResponseDto(updatedTrade);

    // Send real-time notifications
    try {
      await this.tradesGateway.notifyCounterOffer(trade.buyer_id, tradeResponse);
    } catch (error) {
      this.logger.error(`Failed to send counter offer notification: ${error.message}`);
    }

    return tradeResponse;
  }

  // Get trade details
  async getTradeDetails(tradeId: string, userId: string): Promise<TradeResponseDto> {
    this.logger.log(`Fetching trade details for ${tradeId} by user ${userId}`);

    const trade = await this.tradeRepository.findOne({
      where: { id: tradeId },
      relations: ['buyer', 'seller', 'product']
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    // Check if user is authorized to view this trade
    if (trade.buyer_id !== userId && trade.seller_id !== userId) {
      throw new ForbiddenException('You are not authorized to view this trade');
    }

    return this.mapToResponseDto(trade);
  }

  // Bulk accept trades
  async bulkAcceptTrades(tradeIds: string[], sellerId: string): Promise<TradeResponseDto[]> {
    this.logger.log(`Bulk accepting trades for seller ${sellerId}`);

    const results: TradeResponseDto[] = [];
    
    for (const tradeId of tradeIds) {
      try {
        const result = await this.acceptTrade(tradeId, sellerId);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to accept trade ${tradeId}: ${error.message}`);
        // Continue with other trades
      }
    }

    return results;
  }

  // Auto-expire trades (runs every hour)
  @Cron(CronExpression.EVERY_HOUR)
  async autoExpireTrades() {
    this.logger.log('Running auto-expire trades job');

    // Find trades that should be expired
    const expiredTrades = await this.tradeRepository.find({
      where: {
        status: TradeStatus.PENDING,
        expires_at: { $lt: new Date() } as any
      },
      relations: ['buyer', 'seller']
    });

    // Update status and send notifications
    for (const trade of expiredTrades) {
      try {
        await this.tradeRepository.update(trade.id, { status: TradeStatus.EXPIRED });
        
        const tradeResponse = this.mapToResponseDto({ ...trade, status: TradeStatus.EXPIRED });
        await this.tradesGateway.notifyTradeExpired(
          trade.buyer_id,
          trade.seller_id,
          tradeResponse
        );
      } catch (error) {
        this.logger.error(`Failed to expire trade ${trade.id}: ${error.message}`);
      }
    }

    this.logger.log(`Expired ${expiredTrades.length} trades`);
  }

  // Private helper methods
  private async findTradeForSeller(tradeId: string, sellerId: string): Promise<Trade> {
    const trade = await this.tradeRepository.findOne({
      where: { id: tradeId, seller_id: sellerId },
      relations: ['buyer', 'seller', 'product']
    });

    if (!trade) {
      throw new NotFoundException('Trade not found or you are not authorized to modify it');
    }

    return trade;
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Trade>, filters: TradeFilterDto) {
    if (filters.status) {
      queryBuilder.andWhere('trade.status = :status', { status: filters.status });
    }

    if (filters.trade_type) {
      queryBuilder.andWhere('trade.trade_type = :trade_type', { trade_type: filters.trade_type });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(buyer.firstName LIKE :search OR buyer.lastName LIKE :search OR buyer.email LIKE :search OR product.name LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }
  }

  private mapToResponseDto(trade: Trade): TradeResponseDto {
    return {
      id: trade.id,
      buyer_id: trade.buyer_id,
      seller_id: trade.seller_id,
      product_id: trade.product_id,
      status: trade.status,
      trade_type: trade.trade_type,
      offered_price: trade.offered_price,
      counter_offer_price: trade.counter_offer_price || undefined,
      quantity: trade.quantity,
      buyer_message: trade.buyer_message || undefined,
      seller_message: trade.seller_message || undefined,
      rejection_reason: trade.rejection_reason || undefined,
      trade_terms: trade.trade_terms || undefined,
      shipping_details: trade.shipping_details || undefined,
      expires_at: trade.expires_at || undefined,
      accepted_at: trade.accepted_at || undefined,
      completed_at: trade.completed_at || undefined,
      final_price: trade.final_price || undefined,
      is_urgent: trade.is_urgent,
      counter_offer_count: trade.counter_offer_count,
      created_at: trade.created_at,
      updated_at: trade.updated_at,
      buyer: trade.buyer ? {
        id: trade.buyer.id,
        email: trade.buyer.email,
        firstName: trade.buyer.firstName,
        lastName: trade.buyer.lastName
      } : undefined,
      seller: trade.seller ? {
        id: trade.seller.id,
        email: trade.seller.email,
        firstName: trade.seller.firstName,
        lastName: trade.seller.lastName
      } : undefined,
      product: trade.product ? {
        id: trade.product.id,
        name: trade.product.name,
        price: trade.product.price,
        quantity: trade.product.quantity,
        productImage: trade.product.productImage
      } : undefined
    };
  }
} 