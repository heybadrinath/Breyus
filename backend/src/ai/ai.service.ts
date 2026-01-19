import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AIHttpService } from './ai-http.service';
import { PlatformAwarenessService } from './platform-awareness.service';
import { CategoriesService } from '../admin/content/services/categories.service';
import { Product } from '../products/schema/products.schema';
import { Trade } from '../trade/schema/trade.schema';
import { User } from '../users/user.schema';
import { Company } from '../company/company.schema';
import {
  AISearchInputDto,
  CommoditySearchDto,
  MarketAnalysisDto,
  GravityScoreDto,
} from './dto';
import {
  MergedSearchResult,
  EnrichedPartner,
  ProductResult,
  CommodityOption,
  CommoditySearchResult,
  SellerInventoryItem,
  SellerInventoryResult,
} from './interfaces';
import {
  AnalysisInitiateResponse,
  AnalysisResultResponse,
  GravityScoreResponse,
} from './interfaces';

/**
 * Main AI Service
 * Orchestrates AI operations, platform data, and result merging
 */
@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly aiHttpService: AIHttpService,
    private readonly platformAwareness: PlatformAwarenessService,
    private readonly categoriesService: CategoriesService,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Trade.name) private tradeModel: Model<Trade>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Company.name) private companyModel: Model<Company>,
  ) {}

  /**
   * Main search method - handles both buyer and seller searches
   */
  async search(
    input: AISearchInputDto,
    user: User & { companyId?: string },
    userRole: 'Buyer' | 'Seller',
  ): Promise<MergedSearchResult> {
    this.logger.log(`AI Search: ${input.commodity} for ${userRole}`);

    // Get user's company for profile enrichment
    const company = await this.companyModel.findById(user.companyId);

    // 1. Call AI server for predictions
    // Build buyer/seller identifiers based on user role
    const isBuyer = userRole === 'Buyer';
    const companyName = company?.companyName || user.mail || 'Unknown';

    // Build profile context from company data
    // Only include country as other fields aren't in the Company schema yet
    const profile = company?.deliveryAddresses?.[0]?.country ? {
      country: company.deliveryAddresses[0].country,
    } : undefined;

    const aiResults = await this.aiHttpService.predictPartners({
      commodity: input.commodity,
      role: isBuyer ? 'buyer' : 'seller',
      // Pass buyer/seller names based on role (required by AI service)
      // Note: Don't send buyer_id/seller_id - MongoDB ObjectIds are incompatible with PostgreSQL UUIDs
      buyer_name: isBuyer ? companyName : undefined,
      seller_name: !isBuyer ? companyName : undefined,
      country_preference: input.country,
      port_preference: input.port,
      price_range: input.priceRange,
      hs_code: input.hsCode,
      top_k: input.limit || 20,
      profile: profile,
    });

    // 2. Enrich AI results with platform awareness
    const enrichedAiResults = await this.platformAwareness.enrichPartners(
      aiResults.top_partners,
    );

    // 3. Role-specific logic
    if (userRole === 'Buyer') {
      return this.mergeBuyerResults(input, enrichedAiResults);
    } else {
      return this.mergeSellerResults(input, enrichedAiResults);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SELLER LOGIC: Find buyers from 3 sources
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get buyers from platform trade history
   * Returns buyers who previously purchased the same commodity on Breyus
   *
   * Query Logic:
   * - negotiationStatus: 'accepted' = trade was agreed upon
   * - tradePhase beyond 'PR' = trade is in progress or completed
   */
  private async getTradeHistoryBuyers(
    hsCode: string | undefined,
    commodity: string,
  ): Promise<EnrichedPartner[]> {
    // Find trades that were accepted OR progressed beyond PR stage
    const query: any = {
      $or: [
        { negotiationStatus: 'accepted' },
        { tradePhase: { $in: ['SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL', 'COMPLETED'] } },
      ],
    };

    // Match by commodity name (productDetails may contain product info)
    // The trade references product, so we need to join with Product
    const completedTrades = await this.tradeModel.find(query)
      .populate({
        path: 'product',
        select: 'name hsnCode category',
      })
      .populate({
        path: 'buyer',
        select: 'mail company',
        populate: {
          path: 'company',
          select: 'companyName companyMobile deliveryAddresses',
        },
      })
      .select('buyer product quantity acceptedAt completedAt createdAt')
      .sort({ acceptedAt: -1, createdAt: -1 })
      .lean();

    // Filter by commodity match
    const matchingTrades = completedTrades.filter((trade: any) => {
      if (!trade.product) return false;
      const productName = trade.product.name?.toLowerCase() || '';
      const productHsn = trade.product.hsnCode || '';
      const commodityLower = commodity.toLowerCase();

      if (hsCode) {
        const hsPrefix = hsCode.substring(0, 4);
        return productHsn.startsWith(hsPrefix) || productName.includes(commodityLower);
      }
      return productName.includes(commodityLower);
    });

    // Group by buyer and calculate stats
    const buyerMap = new Map<string, {
      buyer: any;
      buyerCompany: any;
      trades: any[];
      totalQuantity: number;
      lastTradeDate: Date | undefined;
    }>();

    for (const trade of matchingTrades) {
      const buyerData = trade.buyer as any;
      if (!buyerData?._id) continue;

      const buyerId = buyerData._id.toString();
      const tradeAny = trade as any;

      if (!buyerMap.has(buyerId)) {
        buyerMap.set(buyerId, {
          buyer: buyerData,
          buyerCompany: buyerData.company,
          trades: [],
          totalQuantity: 0,
          lastTradeDate: undefined,
        });
      }

      const entry = buyerMap.get(buyerId)!;
      entry.trades.push(trade);

      // Parse quantity as number (convert from any type)
      const qty = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(String(trade.quantity)) || 0;
      entry.totalQuantity += qty;

      // Track most recent trade date (prefer completedAt > acceptedAt > createdAt)
      const tradeDate = tradeAny.completedAt || tradeAny.acceptedAt || tradeAny.createdAt;
      if (tradeDate) {
        const tradeDateObj = new Date(tradeDate);
        if (!entry.lastTradeDate || tradeDateObj > entry.lastTradeDate) {
          entry.lastTradeDate = tradeDateObj;
        }
      }
    }

    // Convert to EnrichedPartner format
    const result: EnrichedPartner[] = [];

    for (const [, data] of buyerMap) {
      result.push({
        resultType: 'partner',  // Discriminant for type narrowing
        id: data.buyer._id.toString(),
        name: data.buyerCompany?.companyName || 'Unknown',
        matchScore: 95, // High score for proven buyers
        matchReason: `Completed ${data.trades.length} trade(s) for this commodity`,
        commodity: commodity,
        country: data.buyerCompany?.deliveryAddresses?.[0]?.country,
        contactInfo: {
          email: data.buyer.mail,
          phone: data.buyerCompany?.companyMobile,
        },
        isOnPlatform: true,
        platformCompanyId: data.buyerCompany?._id?.toString(),
        platformUserId: data.buyer._id.toString(),
        sourceType: 'platform_trade_history',
        probability: 95,
        riskLevel: 'Very Low',
        tradeCount: data.trades.length,
        totalQuantity: data.totalQuantity,
        lastTradeDate: data.lastTradeDate,
      });
    }

    this.logger.log(`Found ${result.length} buyers from trade history`);
    return result;
  }

  /**
   * Get platform buyers who have shown interest in similar commodities
   * This includes buyers with:
   * - Pending purchase requests for similar products
   * - Active trades (negotiating) for similar products
   * This ensures new buyers who haven't completed trades are still visible to sellers
   */
  private async getInterestedPlatformBuyers(
    hsCode: string | undefined,
    commodity: string,
  ): Promise<EnrichedPartner[]> {
    // Find trades that are in progress (not yet completed) - these are interested buyers
    const pendingTrades = await this.tradeModel.find({
      $or: [
        { negotiationStatus: 'pending' },
        { negotiationStatus: 'counter_offer' },
        { tradePhase: 'PR' }, // Purchase Request stage
      ],
    })
      .populate({
        path: 'product',
        select: 'name hsnCode category',
      })
      .populate({
        path: 'buyer',
        select: 'mail company role',
        populate: {
          path: 'company',
          select: 'companyName companyMobile deliveryAddresses',
        },
      })
      .select('buyer product quantity createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Filter by commodity match
    const matchingTrades = pendingTrades.filter((trade: any) => {
      if (!trade.product) return false;
      const productName = trade.product.name?.toLowerCase() || '';
      const productHsn = trade.product.hsnCode || '';
      const commodityLower = commodity.toLowerCase();

      if (hsCode) {
        const hsPrefix = hsCode.substring(0, 4);
        return productHsn.startsWith(hsPrefix) || productName.includes(commodityLower);
      }
      return productName.includes(commodityLower);
    });

    // Group by buyer
    const buyerMap = new Map<string, {
      buyer: any;
      buyerCompany: any;
      requestCount: number;
      latestRequest: Date | undefined;
    }>();

    for (const trade of matchingTrades) {
      const buyerData = trade.buyer as any;
      if (!buyerData?._id) continue;

      const buyerId = buyerData._id.toString();

      if (!buyerMap.has(buyerId)) {
        buyerMap.set(buyerId, {
          buyer: buyerData,
          buyerCompany: buyerData.company,
          requestCount: 0,
          latestRequest: undefined,
        });
      }

      const entry = buyerMap.get(buyerId)!;
      entry.requestCount++;

      const requestDate = new Date(trade.createdAt);
      if (!entry.latestRequest || requestDate > entry.latestRequest) {
        entry.latestRequest = requestDate;
      }
    }

    // Convert to EnrichedPartner format
    const result: EnrichedPartner[] = [];

    for (const [, data] of buyerMap) {
      result.push({
        resultType: 'partner',
        id: data.buyer._id.toString(),
        name: data.buyerCompany?.companyName || 'Unknown',
        matchScore: 80, // Lower score than proven buyers
        matchReason: `${data.requestCount} active request(s) for this commodity`,
        commodity: commodity,
        country: data.buyerCompany?.deliveryAddresses?.[0]?.country,
        contactInfo: {
          email: data.buyer.mail,
          phone: data.buyerCompany?.companyMobile,
        },
        isOnPlatform: true,
        platformCompanyId: data.buyerCompany?._id?.toString(),
        platformUserId: data.buyer._id.toString(),
        sourceType: 'platform_only',
        probability: 80,
        riskLevel: 'Low',
        tradeCount: data.requestCount,
        lastTradeDate: data.latestRequest,
      });
    }

    this.logger.log(`Found ${result.length} interested platform buyers`);
    return result;
  }

  /**
   * Merge seller results from 3 sources
   * Now includes interested platform buyers (buyers with pending requests)
   */
  private async mergeSellerResults(
    input: AISearchInputDto,
    aiResults: EnrichedPartner[],
  ): Promise<MergedSearchResult> {
    // Get platform trade history buyers (completed trades)
    const tradeHistoryBuyers = await this.getTradeHistoryBuyers(input.hsCode, input.commodity);

    // Get interested platform buyers (pending requests)
    const interestedBuyers = await this.getInterestedPlatformBuyers(input.hsCode, input.commodity);

    // Create sets for deduplication
    const tradeHistoryIds = new Set(
      tradeHistoryBuyers.map(b => b.platformUserId).filter(Boolean),
    );

    // Filter interested buyers to exclude those already in trade history
    const uniqueInterestedBuyers = interestedBuyers.filter(
      b => !tradeHistoryIds.has(b.platformUserId),
    );

    const allPlatformBuyerIds = new Set([
      ...tradeHistoryIds,
      ...uniqueInterestedBuyers.map(b => b.platformUserId).filter(Boolean),
    ]);

    // Tier 1: Platform trade history (proven buyers with completed trades)
    const tier1 = tradeHistoryBuyers;

    // Tier 2: Platform buyers without trade history
    // Combines: interested buyers + AI matches on platform (not in tier1)
    const aiOnPlatform = aiResults.filter(ai =>
      ai.isOnPlatform && !allPlatformBuyerIds.has(ai.platformUserId),
    );
    const tier2 = [...uniqueInterestedBuyers, ...aiOnPlatform];

    // Tier 3: AI results not on platform
    const tier3 = aiResults.filter(ai => !ai.isOnPlatform);

    return {
      tier1,
      tier2,
      tier3,
      totalMatches: tier1.length + tier2.length + tier3.length,
      searchType: 'seller',
      commodity: input.commodity,
      hsCode: input.hsCode,
      searchParams: {
        country: input.country,
        port: input.port,
        priceRange: input.priceRange,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // BUYER LOGIC: Find sellers/products from 3 sources
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get platform products matching the commodity
   */
  private async getPlatformProducts(
    hsCode: string | undefined,
    commodity: string,
  ): Promise<ProductResult[]> {
    const query: any = {
      isActive: true,
    };

    // Match by HS code prefix or name
    if (hsCode) {
      const hsPrefix = hsCode.substring(0, 4);
      query.$or = [
        { hsnCode: { $regex: `^${hsPrefix}` } },
        { name: { $regex: commodity, $options: 'i' } },
        { category: { $regex: commodity, $options: 'i' } },
      ];
    } else {
      query.$or = [
        { name: { $regex: commodity, $options: 'i' } },
        { category: { $regex: commodity, $options: 'i' } },
      ];
    }

    const products = await this.productModel.find(query)
      .select('name price currency hsnCode category description stock stockUnit moq moqUnit productImages selectedIncoterm nearestPort exportLocation userId')
      .limit(50)
      .lean();

    // Get seller information for each product
    const productResults: ProductResult[] = [];

    for (const product of products) {
      // Get seller's company info - userId is a string reference
      const user = await this.userModel.findById(product.userId)
        .populate('company', 'companyName deliveryAddresses')
        .lean() as any;

      const sellerCompany = user?.company;

      productResults.push({
        resultType: 'product',  // Discriminant for type narrowing
        _id: product._id.toString(),
        name: product.name,
        price: String(product.price ?? ''),
        currency: product.currency,
        hsnCode: product.hsnCode,
        category: product.category,
        description: product.description,
        stock: String(product.stock ?? ''),
        stockUnit: product.stockUnit,
        moq: String(product.moq ?? ''),
        moqUnit: product.moqUnit,
        userId: product.userId,
        sellerName: sellerCompany?.companyName || 'Unknown Seller',
        sellerCompanyId: sellerCompany?._id?.toString(),
        sellerCountry: sellerCompany?.deliveryAddresses?.[0]?.country,
        productImages: product.productImages,
        selectedIncoterm: product.selectedIncoterm,
        nearestPort: product.nearestPort,
        exportLocation: product.exportLocation,
        isOnPlatform: true,
        sourceType: 'platform_only',
      });
    }

    this.logger.log(`Found ${productResults.length} platform products`);
    return productResults;
  }

  /**
   * Merge buyer results from 3 sources
   */
  private async mergeBuyerResults(
    input: AISearchInputDto,
    aiResults: EnrichedPartner[],
  ): Promise<MergedSearchResult> {
    // Get platform products
    const platformProducts = await this.getPlatformProducts(input.hsCode, input.commodity);

    // Get company IDs from AI results that are on platform
    const aiCompanyIds = new Set(
      aiResults
        .filter(ai => ai.isOnPlatform && ai.platformCompanyId)
        .map(ai => ai.platformCompanyId),
    );

    // Tier 1: Platform products WHERE seller company ALSO in AI results
    const tier1: ProductResult[] = platformProducts
      .filter(p => p.sellerCompanyId && aiCompanyIds.has(p.sellerCompanyId))
      .map(p => {
        // Find the AI match for this product's seller
        const aiMatch = aiResults.find(ai => ai.platformCompanyId === p.sellerCompanyId);
        return {
          ...p,
          sourceType: 'platform_and_ai' as const,
          aiMatchScore: aiMatch?.matchScore,
          aiMatchReason: aiMatch?.matchReason,
        };
      });

    // Tier 2: Other platform products (not in AI results)
    const tier1ProductIds = new Set(tier1.map(p => p._id));
    const tier2: ProductResult[] = platformProducts
      .filter(p => !tier1ProductIds.has(p._id))
      .map(p => ({ ...p, sourceType: 'platform_only' as const }));

    // Tier 3: AI results not on platform
    const tier3 = aiResults.filter(ai => !ai.isOnPlatform);

    return {
      tier1,
      tier2,
      tier3,
      totalMatches: tier1.length + tier2.length + tier3.length,
      searchType: 'buyer',
      commodity: input.commodity,
      hsCode: input.hsCode,
      searchParams: {
        country: input.country,
        port: input.port,
        priceRange: input.priceRange,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // COMMODITY SEARCH (for selection page)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Search commodities for the selection page
   * Returns mainstream + niche from categories + niche from AI
   */
  async searchCommodities(input: CommoditySearchDto): Promise<CommoditySearchResult> {
    // Get mainstream and niche categories from categories service
    const groupedCategories = await this.categoriesService.getCategoriesGroupedByClassification();

    // Filter by search query
    const query = input.query?.toLowerCase() || '';

    // Get niche from AI server
    const aiNiche = await this.aiHttpService.searchNicheCommodities(input.query, input.limit);

    // Build result - filter by search query
    // Note: parent is populated with { name, slug } from categoriesService
    const mainstream: CommodityOption[] = groupedCategories.mainstream
      .filter(m => !query || m.name.toLowerCase().includes(query))
      .map(m => {
        const parentObj = m.parent as any; // parent is populated object with name, slug
        return {
          name: m.name,
          category: parentObj?.name || m.name,
          source: 'mainstream' as const,
          isMainstream: true,
          hsCode: m.hsCodePrefix,
        };
      });

    const niche: CommodityOption[] = [
      // Platform niche categories
      ...groupedCategories.niche
        .filter(n => !query || n.name.toLowerCase().includes(query))
        .map(n => {
          const parentObj = n.parent as any; // parent is populated object with name, slug
          return {
            name: n.name,
            hsCode: n.hsCodePrefix,
            category: parentObj?.name || n.name,
            source: 'platform' as const,
            isMainstream: false,
          };
        }),
      // AI niche commodities
      ...aiNiche.results.map(n => ({
        name: n.name,
        hsCode: n.hs_code,
        category: n.category,
        source: 'ai' as const,
        isMainstream: false,
      })),
    ];

    return {
      mainstream,
      niche,
      totalResults: mainstream.length + niche.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // MARKET ANALYSIS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Start async market analysis
   * Note: AI service requires either market_context OR source/destination country
   * When no country is provided, we send a minimal market_context to satisfy validation
   */
  async startAnalysis(input: MarketAnalysisDto): Promise<AnalysisInitiateResponse> {
    const hasCountry = input.destinationCountry || input.sourceCountry;

    return this.aiHttpService.initiateAnalysis({
      commodity: input.commodity,
      hs_code: input.hsCode,
      destination_country: input.destinationCountry,
      source_country: input.sourceCountry,
      // Provide minimal market_context when no country is specified
      // This satisfies the AI service's validation requirement
      market_context: !hasCountry ? { buyer_country: undefined, seller_country: undefined } : undefined,
    });
  }

  /**
   * Get analysis results (for polling)
   */
  async getAnalysisResults(jobId: string): Promise<AnalysisResultResponse> {
    return this.aiHttpService.getAnalysisResults(jobId);
  }

  // ═══════════════════════════════════════════════════════════════
  // GRAVITY SCORE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calculate gravity score for a potential trade
   */
  async calculateGravityScore(input: GravityScoreDto): Promise<GravityScoreResponse> {
    return this.aiHttpService.calculateGravityScore({
      commodity: input.commodity,
      hs_code: input.hsCode,
      buyer_id: input.buyerId,
      buyer_name: input.buyerName,
      seller_id: input.sellerId,
      seller_name: input.sellerName,
      buyer_country: input.buyerCountry,
      seller_country: input.sellerCountry,
      price_range: input.priceRange,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // HEALTH CHECK
  // ═══════════════════════════════════════════════════════════════

  /**
   * Check AI server health
   */
  async checkHealth() {
    return this.aiHttpService.checkHealth();
  }

  // ═══════════════════════════════════════════════════════════════
  // SELLER INVENTORY METHODS (for inventory-based buyer search)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get seller's products for AI selection page
   * Returns products from the seller's inventory
   */
  async getSellerProducts(
    user: User & { companyId?: string },
  ): Promise<SellerInventoryResult> {
    this.logger.log(`Getting products for seller: ${user._id}`);

    // Find all products belonging to this seller
    const products = await this.productModel
      .find({ userId: user._id.toString() })
      .select(
        'name category price currency priceUnit stock stockUnit moq moqUnit hsnCode isActive productImages selectedIncoterm nearestPort',
      )
      .sort({ createdAt: -1 })
      .lean();

    // Get company name for display
    const company = await this.companyModel.findById(user.companyId);

    const inventoryItems: SellerInventoryItem[] = products.map((p) => ({
      _id: p._id.toString(),
      name: p.name,
      category: p.category || '',
      price: String(p.price ?? ''),
      currency: p.currency || 'USD',
      priceUnit: 'per_unit',
      stock: String(p.stock ?? ''),
      stockUnit: p.stockUnit || '',
      moq: String(p.moq ?? ''),
      moqUnit: p.moqUnit || '',
      hsnCode: p.hsnCode || '',
      isActive: p.isActive ?? true,
      productImages: p.productImages,
      selectedIncoterm: p.selectedIncoterm,
      nearestPort: p.nearestPort,
    }));

    this.logger.log(`Found ${inventoryItems.length} products for seller`);

    return {
      products: inventoryItems,
      totalProducts: inventoryItems.length,
      companyName: company?.companyName || 'Unknown Company',
    };
  }

  /**
   * Search for buyers interested in a specific product
   * Uses the product's commodity to find potential buyers
   */
  async searchBuyersForProduct(
    productId: string,
    user: User & { companyId?: string },
    countryFilter?: string,
    limit?: number,
  ): Promise<MergedSearchResult> {
    this.logger.log(`Searching buyers for product: ${productId}`);

    // Get the product details
    const product = await this.productModel.findById(productId).lean();

    if (!product) {
      throw new Error('Product not found');
    }

    // Verify the product belongs to this seller
    if (product.userId !== user._id.toString()) {
      throw new Error('You can only search for buyers for your own products');
    }

    // Use the product's commodity to search for buyers
    const commodity = product.name || product.category;
    const hsCode = product.hsnCode;

    // Build search input from product data
    const searchInput: AISearchInputDto = {
      commodity,
      hsCode,
      country: countryFilter,
      limit: limit || 20,
    };

    // Use the existing seller search logic
    return this.search(searchInput, user, 'Seller');
  }
}
