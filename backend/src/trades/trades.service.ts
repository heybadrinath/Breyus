import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Trade, TradeStatus, TradeType } from './entities/trade.entity';
import { Product } from '../products/entities/product.entity';
import { CreateTradeRequestDto, UpdateTradeStatusDto, CounterOfferDto, TradeResponseDto, TradeFilterDto } from './dto/trade.dto';
import { PurchaseRequestDto, ValidatePurchaseRequestStepDto } from './dto/purchase-request.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TradesGateway } from './trades.gateway';
import { validate } from 'class-validator';

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

  // Get outgoing trade requests for a buyer
  async getMyTradeRequests(buyerId: string, filters: TradeFilterDto): Promise<{ trades: TradeResponseDto[], total: number, page: number, totalPages: number }> {
    this.logger.log(`Fetching trade requests for buyer ${buyerId}`);
    this.logger.log(`Raw filters received: ${JSON.stringify(filters)}`);

    const queryBuilder = this.tradeRepository
      .createQueryBuilder('trade')
      .leftJoinAndSelect('trade.seller', 'seller')
      .leftJoinAndSelect('trade.product', 'product')
      .where('trade.buyer_id = :buyerId', { buyerId });

    // Apply filters (same filtering logic but for buyer's outgoing requests)
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

    this.logger.log(`Found ${trades.length} buyer trade requests out of ${total} total`);

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

  // Purchase Request Validation Methods
  async validatePurchaseRequestStep(validateStepDto: ValidatePurchaseRequestStepDto): Promise<{ valid: boolean; errors?: string[] }> {
    this.logger.log(`Validating purchase request step ${validateStepDto.step}`);
    
    const { step, data } = validateStepDto;
    const errors: string[] = [];    try {
      switch (step) {
        case 1: // Step 1: Trade Queries 1
          await this.validateStep1(data, errors);
          break;
        case 2: // Step 2: Trade Queries 2
          await this.validateStep2(data, errors);
          break;
        case 3: // Step 3: Pricing (Inco-Terms)
          await this.validateStep3(data, errors);
          break;
        case 4: // Step 4: Payment Mode
          await this.validateStep4(data, errors);
          break;
        default:
          errors.push('Invalid step number');
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      this.logger.error(`Error validating step ${step}: ${error.message}`);
      return {
        valid: false,
        errors: ['Validation failed due to server error']
      };
    }
  }

  async validateCompletePurchaseRequest(purchaseRequestDto: PurchaseRequestDto): Promise<{ valid: boolean; errors?: string[] }> {
    this.logger.log('Validating complete purchase request');
    
    try {
      const validationErrors = await validate(purchaseRequestDto);
      
      if (validationErrors.length > 0) {
        const errors = validationErrors.map(error => 
          Object.values(error.constraints || {}).join(', ')
        ).filter(Boolean);
        
        return {
          valid: false,
          errors
        };
      }

      return {
        valid: true
      };
    } catch (error) {
      this.logger.error(`Error validating complete purchase request: ${error.message}`);
      return {
        valid: false,
        errors: ['Validation failed due to server error']
      };
    }
  }

  async submitPurchaseRequest(userId: string, purchaseRequestDto: PurchaseRequestDto): Promise<{ message: string; requestId: string }> {
    this.logger.log(`Submitting purchase request for user ${userId}`);
    
    try {
      // First validate the complete request
      const validation = await this.validateCompletePurchaseRequest(purchaseRequestDto);
      if (!validation.valid) {
        throw new BadRequestException(`Invalid purchase request: ${validation.errors?.join(', ')}`);
      }

      // Generate a unique request ID
      const requestId = `PR-${Date.now()}-${userId.slice(-6)}`;
      
      // Here you would typically save the purchase request to database
      // For now, we'll just log it and return success
      this.logger.log(`Purchase request submitted successfully: ${requestId}`);
      
      return {
        message: 'Purchase request submitted successfully',
        requestId
      };
    } catch (error) {
      this.logger.error(`Error submitting purchase request: ${error.message}`);
      throw new BadRequestException('Failed to submit purchase request');
    }
  }

  // Step validation methods
  private async validateStep1(data: any, errors: string[]): Promise<void> {
    if (!data) {
      errors.push('Step 1 data is required');
      return;
    }

    if (!data.companyRevenueRange || data.companyRevenueRange <= 0) {
      errors.push('Company revenue range is required and must be greater than 0');
    }

    if (!data.currency || !['USD', 'INR'].includes(data.currency)) {
      errors.push('Currency is required and must be USD or INR');
    }

    if (!data.revenueUnit || !['Crore', 'Million'].includes(data.revenueUnit)) {
      errors.push('Revenue unit is required and must be Crore or Million');
    }

    if (!data.tradeDurationYears || data.tradeDurationYears < 1) {
      errors.push('Trade duration is required and must be at least 1 year');
    }

    if (!data.productUsage || typeof data.productUsage !== 'string' || data.productUsage.trim().length === 0) {
      errors.push('Product usage description is required');
    }
  }

  private async validateStep2(data: any, errors: string[]): Promise<void> {
    if (!data) {
      errors.push('Step 2 data is required');
      return;
    }

    if (!data.industry || typeof data.industry !== 'string' || data.industry.trim().length === 0) {
      errors.push('Industry information is required');
    }

    if (data.marketExperienceYears === undefined || data.marketExperienceYears < 0) {
      errors.push('Market experience is required and cannot be negative');
    }

    if (data.marketCapturePercentage === undefined || data.marketCapturePercentage < 0 || data.marketCapturePercentage > 100) {
      errors.push('Market capture percentage is required and must be between 0 and 100');
    }
  }

  private async validateStep3(data: any, errors: string[]): Promise<void> {
    if (!data) {
      errors.push('Step 3 data is required');
      return;
    }

    if (!data.price || data.price <= 0) {
      errors.push('Price is required and must be greater than 0');
    }

    if (!data.priceCurrency || !['USD', 'INR', 'EUR'].includes(data.priceCurrency)) {
      errors.push('Price currency is required and must be USD, INR, or EUR');
    }

    // Optional fields validation
    if (data.discount !== undefined && (data.discount < 0 || data.discount > 100)) {
      errors.push('Discount must be between 0 and 100%');
    }

    if (data.margin !== undefined && (data.margin < 0 || data.margin > 100)) {
      errors.push('Margin must be between 0 and 100%');
    }

    if (data.salePrice !== undefined && data.salePrice < 0) {
      errors.push('Sale price cannot be negative');
    }

    if (data.costOfGoods !== undefined && data.costOfGoods < 0) {
      errors.push('Cost of goods cannot be negative');
    }
  }

  private async validateStep4(data: any, errors: string[]): Promise<void> {
    if (!data) {
      errors.push('Step 4 data is required');
      return;
    }

    if (!data.paymentMode || !['advance', 'credit', 'open'].includes(data.paymentMode)) {
      errors.push('Payment mode is required and must be advance, credit, or open');
    }

    // Validate payment mode specific fields
    if (data.paymentMode === 'advance') {
      if (data.advancePercentage === undefined || data.advancePercentage < 0 || data.advancePercentage > 100) {
        errors.push('Advance percentage is required and must be between 0 and 100%');
      }
    }

    if (data.paymentMode === 'credit') {
      if (!data.creditTimelineDays || data.creditTimelineDays < 1) {
        errors.push('Credit timeline is required and must be at least 1 day');
      }
    }

    if (data.paymentMode === 'open') {
      if (!data.paymentTimelineDays || data.paymentTimelineDays < 1) {
        errors.push('Payment timeline is required and must be at least 1 day');
      }
    }
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
    const result = {
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
    
    this.logger.log(`🔍 Mapping trade ${trade.id} to response: offered_price=${trade.offered_price}`);
    return result;
  }
}