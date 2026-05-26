import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AIService } from './ai.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  AISearchInputDto,
  CommoditySearchDto,
  MarketAnalysisDto,
  GravityScoreDto,
  SearchFromProductDto,
} from './dto';

/**
 * AI Controller
 * Handles all AI-related endpoints for buyer/seller matching, analysis, and scoring
 */
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  /**
   * Main search endpoint - handles both buyer and seller searches
   * POST /ai/search
   *
   * For Sellers: Returns potential buyers (3 tiers)
   *   - Tier 1: Platform trade history (proven buyers)
   *   - Tier 2: AI matches on platform
   *   - Tier 3: AI-only results (off-platform)
   *
   * For Buyers: Returns products/sellers (3 tiers)
   *   - Tier 1: Platform products where seller is also in AI results
   *   - Tier 2: Other platform products
   *   - Tier 3: AI-only sellers (off-platform)
   */
  @Post('search')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async search(@Body() input: AISearchInputDto, @Request() req: any) {
    const user = req.user;
    const userRole = user.role as 'Buyer' | 'Seller';

    const result = await this.aiService.search(input, user, userRole);

    return {
      statusCode: HttpStatus.OK,
      message: 'Search completed successfully',
      data: result,
    };
  }

  /**
   * Commodity search for selection page
   * POST /ai/commodity-search
   *
   * Returns mainstream commodities + niche from platform + niche from AI
   */
  @Post('commodity-search')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async searchCommodities(@Body() input: CommoditySearchDto) {
    const result = await this.aiService.searchCommodities(input);

    return {
      statusCode: HttpStatus.OK,
      message: 'Commodity search completed',
      data: result,
    };
  }

  /**
   * Start async market analysis
   * POST /ai/analysis/start
   *
   * Returns jobId for polling
   * User is tracked for notification when analysis completes
   */
  @Post('analysis/start')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async startAnalysis(@Body() input: MarketAnalysisDto, @Request() req: any) {
    const userId = req.user?._id?.toString();
    const userRole = req.user?.role;
    const result = await this.aiService.startAnalysis(input, userId, userRole);

    return {
      statusCode: HttpStatus.ACCEPTED,
      message: 'Analysis started',
      data: result,
    };
  }

  /**
   * Poll for analysis results
   * GET /ai/analysis/:jobId
   *
   * When analysis completes, a notification is sent to the user
   */
  @Get('analysis/:jobId')
  @UseGuards(AuthGuard)
  async getAnalysisResults(@Param('jobId') jobId: string, @Request() req: any) {
    const userId = req.user?._id?.toString();
    const result = await this.aiService.getAnalysisResults(jobId, userId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Analysis results retrieved',
      data: result,
    };
  }

  /**
   * Calculate gravity score for a potential trade
   * POST /ai/gravity-score
   */
  @Post('gravity-score')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async calculateGravityScore(@Body() input: GravityScoreDto) {
    const result = await this.aiService.calculateGravityScore(input);

    return {
      statusCode: HttpStatus.OK,
      message: 'Gravity score calculated',
      data: result,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // SELLER INVENTORY ENDPOINTS (for inventory-based buyer search)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get seller's inventory for AI selection
   * GET /ai/seller/inventory
   *
   * Returns the seller's products so they can select which one to search buyers for
   */
  @Get('seller/inventory')
  @UseGuards(AuthGuard)
  async getSellerInventory(@Request() req: any) {
    const user = req.user;

    // Verify user is a seller (allow both 'Seller' and 'Seller and Buyer' roles)
    if (user.role !== 'Seller' && user.role !== 'Seller and Buyer') {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Only sellers can access inventory',
        data: null,
      };
    }

    const result = await this.aiService.getSellerProducts(user);

    return {
      statusCode: HttpStatus.OK,
      message: 'Seller inventory retrieved successfully',
      data: result,
    };
  }

  /**
   * Search buyers for a specific product
   * POST /ai/search/from-product
   *
   * Seller selects a product from their inventory and searches for potential buyers
   */
  @Post('search/from-product')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async searchFromProduct(
    @Body() input: SearchFromProductDto,
    @Request() req: any,
  ) {
    const user = req.user;

    // Verify user is a seller (allow both 'Seller' and 'Seller and Buyer' roles)
    if (user.role !== 'Seller' && user.role !== 'Seller and Buyer') {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Only sellers can search for buyers',
        data: null,
      };
    }

    const result = await this.aiService.searchBuyersForProduct(
      input.productId,
      user,
      input.country,
      input.limit,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Buyer search completed successfully',
      data: result,
    };
  }

  /**
   * Health check for AI server
   * GET /ai/health
   */
  @Get('health')
  async checkHealth() {
    const result = await this.aiService.checkHealth();

    return {
      statusCode: HttpStatus.OK,
      message: 'AI server health check',
      data: result,
    };
  }
}
