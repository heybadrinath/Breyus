import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Param, 
  Body, 
  Query, 
  UseGuards, 
  Request, 
  HttpException, 
  HttpStatus, 
  Logger,
  ParseUUIDPipe,
  ValidationPipe,
  Res
} from '@nestjs/common';
import { Response } from 'express';
import { TradesService } from './trades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTradeRequestDto, UpdateTradeStatusDto, CounterOfferDto, TradeFilterDto, TradeResponseDto } from './dto/trade.dto';
import { PurchaseRequestDto, ValidatePurchaseRequestStepDto } from './dto/purchase-request.dto';
import { TradeStatus, TradeType } from './entities/trade.entity';
import { PdfService } from '../pdf/pdf.service';

@Controller('trades')
export class TradesController {
  private readonly logger = new Logger(TradesController.name);

  constructor(
    private readonly tradesService: TradesService,
    private readonly pdfService: PdfService
  ) {}

  // Debug endpoint - no auth required
  @Get('health')
  async healthCheck(): Promise<{ status: string; timestamp: string; message: string }> {
    this.logger.log('GET /trades/health - Health check called');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Trades API is running'
    };
  }

  // Debug endpoint to create sample trade data - no auth required
  @Post('create-sample-data')
  async createSampleData(): Promise<{ message: string; count: number }> {
    this.logger.log('POST /trades/create-sample-data - Creating sample trade data');
    
    try {
      // You'll need to replace these UUIDs with actual user and product IDs from your database
      const sampleTrades = [
        {
          buyer_id: '37eb01fc-58b0-426f-9334-8a21f0d9cea5', // Use the authenticated user's ID
          seller_id: '37eb01fc-58b0-426f-9334-8a21f0d9cea5', // Same for now, you can change this
          product_id: '11111111-1111-1111-1111-111111111111', // You'll need a real product ID
          offered_price: 1500.00,
          quantity: 10,
          buyer_message: 'Interested in bulk purchase',
          trade_type: 'purchase_request' as any,
          is_urgent: false
        },
        {
          buyer_id: '22222222-2222-2222-2222-222222222222', // Another user ID
          seller_id: '37eb01fc-58b0-426f-9334-8a21f0d9cea5', // Your seller ID
          product_id: '33333333-3333-3333-3333-333333333333', // Another product ID
          offered_price: 750.00,
          quantity: 5,
          buyer_message: 'Need urgent delivery',
          trade_type: 'purchase_request' as any,
          is_urgent: true
        }
      ];

      // Create trades directly in the repository for testing
      const trades = await this.tradesService['tradeRepository'].save(
        sampleTrades.map(trade => this.tradesService['tradeRepository'].create({
          ...trade,
          status: TradeStatus.PENDING,
          trade_type: TradeType.PURCHASE_REQUEST,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          counter_offer_count: 0
        }))
      );

      return {
        message: 'Sample trade data created successfully',
        count: trades.length
      };
    } catch (error) {
      this.logger.error(`Error creating sample data: ${error.message}`, error.stack);
      return {
        message: `Error creating sample data: ${error.message}`,
        count: 0
      };
    }
  }

  // GET /trades/incoming - Fetch pending trade requests for authenticated seller
  @Get('incoming')
  @UseGuards(JwtAuthGuard)
  async getIncomingTrades(
    @Request() req,
    @Query(new ValidationPipe({ transform: true })) filters: TradeFilterDto
  ): Promise<{ 
    trades: TradeResponseDto[], 
    total: number, 
    page: number, 
    totalPages: number 
  }> {
    try {
      this.logger.log(`GET /trades/incoming - Request received`);
      this.logger.log(`User from request: ${JSON.stringify(req.user)}`);
      this.logger.log(`Filters: ${JSON.stringify(filters)}`);
      
      if (!req.user || !req.user.id) {
        this.logger.error('No user found in request object');
        throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
      }

      const sellerId = req.user.id;
      this.logger.log(`GET /trades/incoming - Seller: ${sellerId}`);
      
      return await this.tradesService.getIncomingTrades(sellerId, filters);
    } catch (error) {
      this.logger.error(`Error fetching incoming trades: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to fetch incoming trades',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // POST /trades/:id/accept - Accept a specific trade request
  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  async acceptTrade(
    @Param('id', ParseUUIDPipe) tradeId: string,
    @Request() req,
    @Body('message') message?: string
  ): Promise<TradeResponseDto> {
    try {
      const sellerId = req.user.id;
      this.logger.log(`POST /trades/${tradeId}/accept - Seller: ${sellerId}`);
      
      return await this.tradesService.acceptTrade(tradeId, sellerId, message);
    } catch (error) {
      this.logger.error(`Error accepting trade ${tradeId}: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to accept trade',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // POST /trades/:id/reject - Reject a trade request with optional reason
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectTrade(
    @Param('id', ParseUUIDPipe) tradeId: string,
    @Request() req,
    @Body('rejection_reason') rejectionReason?: string
  ): Promise<TradeResponseDto> {
    try {
      const sellerId = req.user.id;
      this.logger.log(`POST /trades/${tradeId}/reject - Seller: ${sellerId}`);
      
      return await this.tradesService.rejectTrade(tradeId, sellerId, rejectionReason);
    } catch (error) {
      this.logger.error(`Error rejecting trade ${tradeId}: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to reject trade',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // GET /trades/:id/details - Get detailed trade information
  @Get(':id/details')
  @UseGuards(JwtAuthGuard)
  async getTradeDetails(
    @Param('id', ParseUUIDPipe) tradeId: string,
    @Request() req
  ): Promise<TradeResponseDto> {
    try {
      const userId = req.user.id;
      this.logger.log(`GET /trades/${tradeId}/details - User: ${userId}`);
      
      return await this.tradesService.getTradeDetails(tradeId, userId);
    } catch (error) {
      this.logger.error(`Error fetching trade details ${tradeId}: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to fetch trade details',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // PATCH /trades/:id/counter-offer - Allow seller to make counter-offers
  @Patch(':id/counter-offer')
  @UseGuards(JwtAuthGuard)
  async makeCounterOffer(
    @Param('id', ParseUUIDPipe) tradeId: string,
    @Request() req,
    @Body(ValidationPipe) counterOfferDto: CounterOfferDto
  ): Promise<TradeResponseDto> {
    try {
      const sellerId = req.user.id;
      this.logger.log(`PATCH /trades/${tradeId}/counter-offer - Seller: ${sellerId}`);
      
      return await this.tradesService.makeCounterOffer(tradeId, sellerId, counterOfferDto);
    } catch (error) {
      this.logger.error(`Error making counter offer for trade ${tradeId}: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to make counter offer',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // POST /trades - Create a new trade request (for buyers)
  @Post()
  @UseGuards(JwtAuthGuard)
  async createTradeRequest(
    @Request() req,
    @Body(ValidationPipe) createTradeDto: CreateTradeRequestDto
  ): Promise<TradeResponseDto> {
    try {
      const buyerId = req.user.id;
      this.logger.log(`POST /trades - Buyer: ${buyerId}`);
      
      return await this.tradesService.createTradeRequest(buyerId, createTradeDto);
    } catch (error) {
      this.logger.error(`Error creating trade request: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to create trade request',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // POST /trades/bulk-accept - Bulk accept multiple trades
  @Post('bulk-accept')
  @UseGuards(JwtAuthGuard)
  async bulkAcceptTrades(
    @Request() req,
    @Body('trade_ids') tradeIds: string[]
  ): Promise<{ successful: TradeResponseDto[], failed: { tradeId: string, error: string }[] }> {
    try {
      const sellerId = req.user.id;
      this.logger.log(`POST /trades/bulk-accept - Seller: ${sellerId}, Trades: ${tradeIds.length}`);
      
      if (!Array.isArray(tradeIds) || tradeIds.length === 0) {
        throw new HttpException('Invalid trade IDs provided', HttpStatus.BAD_REQUEST);
      }

      const successful = await this.tradesService.bulkAcceptTrades(tradeIds, sellerId);
      const failed: { tradeId: string, error: string }[] = [];

      // Calculate failed trades
      const successfulIds = successful.map(trade => trade.id);
      tradeIds.forEach(id => {
        if (!successfulIds.includes(id)) {
          failed.push({ tradeId: id, error: 'Failed to accept' });
        }
      });

      return { successful, failed };
    } catch (error) {
      this.logger.error(`Error bulk accepting trades: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to bulk accept trades',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // GET /trades/my-requests - Get trade requests created by the authenticated buyer
  @Get('my-requests')
  @UseGuards(JwtAuthGuard)
  async getMyTradeRequests(
    @Request() req,
    @Query(new ValidationPipe({ transform: true })) filters: TradeFilterDto
  ): Promise<{ 
    trades: TradeResponseDto[], 
    total: number, 
    page: number, 
    totalPages: number 
  }> {
    try {
      const buyerId = req.user.id;
      this.logger.log(`GET /trades/my-requests - Buyer: ${buyerId}`);
      
      // For buyers, we need to fetch trades where they are the buyer
      return await this.tradesService.getMyTradeRequests(buyerId, filters);
    } catch (error) {
      this.logger.error(`Error fetching buyer trade requests: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to fetch trade requests',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // GET /trades/stats - Get trade statistics for seller dashboard
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getTradeStats(@Request() req): Promise<{
    total_incoming: number,
    pending: number,
    accepted: number,
    rejected: number,
    expired: number,
    today_incoming: number
  }> {
    try {
      this.logger.log(`GET /trades/stats - Request received`);
      this.logger.log(`User from request: ${JSON.stringify(req.user)}`);
      
      if (!req.user || !req.user.id) {
        this.logger.error('No user found in request object for stats');
        throw new HttpException('Authentication required', HttpStatus.UNAUTHORIZED);
      }

      const sellerId = req.user.id;
      this.logger.log(`GET /trades/stats - Seller: ${sellerId}`);
      
      // Get basic stats using the service
      const [
        totalIncoming,
        pending,
        accepted,
        rejected,
        expired,
        todayIncoming
      ] = await Promise.all([
        this.tradesService.getIncomingTrades(sellerId, { page: 1, limit: 1 }),
        this.tradesService.getIncomingTrades(sellerId, { status: 'pending' as any, page: 1, limit: 1 }),
        this.tradesService.getIncomingTrades(sellerId, { status: 'accepted' as any, page: 1, limit: 1 }),
        this.tradesService.getIncomingTrades(sellerId, { status: 'rejected' as any, page: 1, limit: 1 }),
        this.tradesService.getIncomingTrades(sellerId, { status: 'expired' as any, page: 1, limit: 1 }),
        this.tradesService.getIncomingTrades(sellerId, { page: 1, limit: 1 }) // Would need date filter for today
      ]);

      const stats = {
        total_incoming: totalIncoming.total,
        pending: pending.total,
        accepted: accepted.total,
        rejected: rejected.total,
        expired: expired.total,
        today_incoming: todayIncoming.total // Simplified for now
      };

      this.logger.log(`Stats result: ${JSON.stringify(stats)}`);
      return stats;
    } catch (error) {
      this.logger.error(`Error fetching trade stats: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to fetch trade statistics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // POST /trades/purchase-request/validate-step - Validate individual purchase request steps
  @Post('purchase-request/validate-step')
  @UseGuards(JwtAuthGuard)
  async validatePurchaseRequestStep(
    @Request() req,
    @Body(ValidationPipe) validateStepDto: ValidatePurchaseRequestStepDto
  ): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const userId = req.user.id;
      this.logger.log(`POST /trades/purchase-request/validate-step - User: ${userId}, Step: ${validateStepDto.step}`);
      
      return await this.tradesService.validatePurchaseRequestStep(validateStepDto);
    } catch (error) {
      this.logger.error(`Error validating purchase request step: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to validate purchase request step',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // POST /trades/purchase-request/validate-complete - Validate complete purchase request
  @Post('purchase-request/validate-complete')
  @UseGuards(JwtAuthGuard)
  async validateCompletePurchaseRequest(
    @Request() req,
    @Body(ValidationPipe) purchaseRequestDto: PurchaseRequestDto
  ): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const userId = req.user.id;
      this.logger.log(`POST /trades/purchase-request/validate-complete - User: ${userId}`);
      
      return await this.tradesService.validateCompletePurchaseRequest(purchaseRequestDto);
    } catch (error) {
      this.logger.error(`Error validating complete purchase request: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to validate complete purchase request',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // POST /trades/purchase-request/submit - Submit validated purchase request
  @Post('purchase-request/submit')
  @UseGuards(JwtAuthGuard)
  async submitPurchaseRequest(
    @Request() req,
    @Body(ValidationPipe) purchaseRequestDto: PurchaseRequestDto
  ): Promise<{ message: string; requestId: string }> {
    try {
      const userId = req.user.id;
      this.logger.log(`POST /trades/purchase-request/submit - User: ${userId}`);
      
      return await this.tradesService.submitPurchaseRequest(userId, purchaseRequestDto);
    } catch (error) {
      this.logger.error(`Error submitting purchase request: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to submit purchase request',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // Debug endpoint for validation - no auth required
  @Post('purchase-request/validate-step-debug')
  async validatePurchaseRequestStepDebug(
    @Body(ValidationPipe) validateStepDto: ValidatePurchaseRequestStepDto
  ): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      this.logger.log(`POST /trades/purchase-request/validate-step-debug - Step: ${validateStepDto.step}`);
      
      return await this.tradesService.validatePurchaseRequestStep(validateStepDto);
    } catch (error) {
      this.logger.error(`Error validating purchase request step: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to validate purchase request step',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  // GET /trades/:id/pdf - Generate and serve purchase request PDF
  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  async getPurchaseRequestPdf(
    @Param('id', ParseUUIDPipe) tradeId: string,
    @Request() req,
    @Res() res: Response
  ): Promise<void> {
    try {
      const userId = req.user.id;
      this.logger.log(`GET /trades/${tradeId}/pdf - User: ${userId}`);
      
      // Get trade details with relations
      const trade = await this.tradesService.getTradeDetails(tradeId, userId);
      
      // Generate PDF data from trade
      const pdfData = await this.tradesService.generatePdfDataFromTrade(trade);
      
      // Generate PDF
      const pdfBuffer = await this.pdfService.generatePurchaseRequestPdf(pdfData);
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="purchase-request-${tradeId.substring(0, 8)}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error(`Error generating PDF for trade ${tradeId}: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to generate PDF',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  // GET /trades/pdf/:tradeId - Serve PDF files directly (public access for browser viewing)
  @Get('pdf/:tradeId')
  async servePdfFile(
    @Param('tradeId', ParseUUIDPipe) tradeId: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      this.logger.log(`GET /trades/pdf/${tradeId} - Serving PDF file`);
        // Get trade details (without user authentication for PDF viewing)
      const trade = await this.tradesService.getTradeForPdf(tradeId);
      if (!trade) {
        throw new HttpException('Trade not found', HttpStatus.NOT_FOUND);
      }
        // Convert Trade entity to TradeResponseDto format for PDF generation
      const tradeDto: TradeResponseDto = {
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
        shipping_details: trade.shipping_details || undefined,        expires_at: trade.expires_at || undefined,
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
        } : undefined,
        purchase_request_data: trade.purchase_request_data || undefined
      };
      
      // Generate PDF data from trade
      const pdfData = await this.tradesService.generatePdfDataFromTrade(tradeDto);
      
      // Generate PDF
      const pdfBuffer = await this.pdfService.generatePurchaseRequestPdf(pdfData);
      
      // Set response headers
      const filename = `purchase-request-${tradeId.substring(0, 8)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error(`Error serving PDF file for trade ${tradeId}: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to serve PDF',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}