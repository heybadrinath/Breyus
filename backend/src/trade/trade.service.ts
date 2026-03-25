import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Trade,
  TradePhase,
  DocumentInfo,
  DocumentVersion,
  DocumentRejectionTracking,
} from './schema/trade.schema';
import { CreateTradeDto } from './dto/create-trade.dto';
import { DocumentType } from './dto/upload-document.dto';
import {
  TradePaginationDto,
  TradePaginationResult,
} from './dto/trade-pagination.dto';
import { AuthService } from '../auth/auth.service';
import { Product } from '../products/schema/products.schema';
import { User } from '../users/user.schema';
import { StorageService } from '../common/storage';
import { TradeNotificationService } from './trade-notification.service';
import { AuditService } from './audit.service';
// FIX: Import AnalyticsService for cache invalidation on trade completion
import { AnalyticsService } from '../analytics/analytics.service';

// Constants for trade phase ordering (Issue #18 - DRY principle)
const TRADE_PHASE_ORDER: TradePhase[] = [
  'PR',
  'SCO',
  'ICPO',
  'SPA',
  'PAYMENT',
  'BOL',
  'COMPLETED',
];

// ========================
// DOCUMENT REJECTION LIMITS (Phase 2 Refactoring)
// ========================
// Maximum upload attempts per document type before auto-cancellation
const DOCUMENT_MAX_ATTEMPTS: Record<string, number> = {
  sco: 2,
  icpo: 2,
  spa: 2,
  'signed-spa': 2,
  'payment-proof': 2,
  bol: 3, // BoL gets an extra attempt due to shipping complexity
};

// Map document types to their rejection tracking field names
const REJECTION_TRACKING_FIELD_MAP: Record<string, keyof Trade> = {
  sco: 'scoRejectionTracking',
  icpo: 'icpoRejectionTracking',
  spa: 'spaRejectionTracking',
  'signed-spa': 'signedSpaRejectionTracking',
  'payment-proof': 'paymentProofRejectionTracking',
  bol: 'bolRejectionTracking',
};

// Issue #4 - Negotiation state machine constants
// Closed states where no further negotiation actions are allowed
const CLOSED_NEGOTIATION_STATUSES = [
  'accepted',
  'rejected',
  'cancelled',
  'completed',
];

// Valid state transitions for negotiation
// Key: Current state, Value: Array of [action, allowedParties, nextState]
type NegotiationAction = 'counter' | 'respond' | 'accept' | 'reject';
type Party = 'seller' | 'buyer' | 'both';
const NEGOTIATION_TRANSITIONS: Record<
  string,
  { action: NegotiationAction; allowedBy: Party; nextState: string }[]
> = {
  pending: [
    { action: 'counter', allowedBy: 'seller', nextState: 'countered' },
    { action: 'accept', allowedBy: 'seller', nextState: 'accepted' }, // Seller accepts buyer's initial offer
    { action: 'reject', allowedBy: 'both', nextState: 'rejected' },
  ],
  countered: [
    { action: 'respond', allowedBy: 'buyer', nextState: 'buyer_responded' },
    { action: 'accept', allowedBy: 'buyer', nextState: 'accepted' }, // Buyer accepts seller's counter
    { action: 'reject', allowedBy: 'both', nextState: 'rejected' },
  ],
  buyer_responded: [
    { action: 'counter', allowedBy: 'seller', nextState: 'countered' },
    { action: 'accept', allowedBy: 'seller', nextState: 'accepted' }, // Seller accepts buyer's response
    { action: 'reject', allowedBy: 'both', nextState: 'rejected' },
  ],
};

@Injectable()
export class TradeService {
  constructor(
    @InjectModel(Trade.name) private readonly tradeModel: Model<Trade>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly authService: AuthService,
    private readonly storageService: StorageService,
    private readonly notificationService: TradeNotificationService,
    private readonly auditService: AuditService,
    // FIX: Inject AnalyticsService for cache invalidation on trade completion
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Get user information from account token
   * Returns userId and email for dispute creation
   */
  async getUserFromToken(
    accountToken: string,
  ): Promise<{ userId: Types.ObjectId; email: string } | null> {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        return null;
      }

      const user = await this.userModel.findById(userId).select('mail').lean();
      if (!user) {
        return null;
      }

      return {
        userId: new Types.ObjectId(userId),
        email: user.mail,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Populate a trade with the fields required for rich email notifications.
   * Includes product pricing and buyer/seller company display names.
   */
  private async populateTradeForNotification(tradeId: Types.ObjectId | string) {
    return this.tradeModel
      .findById(tradeId)
      .populate('product', '_id name price currency')
      .populate({
        path: 'buyer',
        select: '_id mail notificationPreferences company',
        populate: {
          path: 'company',
          select: 'companyName founderName',
        },
      })
      .populate({
        path: 'seller',
        select: '_id mail notificationPreferences company',
        populate: {
          path: 'company',
          select: 'companyName founderName',
        },
      });
  }

  async createTrade(createTradeDto: CreateTradeDto, accountToken: string) {
    try {
      // Validate user authentication
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const buyerId = (decodedToken as any).userId;

      if (!buyerId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      // Validate product exists and get seller information
      const product = await this.productModel.findById(
        createTradeDto.productId,
      );
      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      // ==========================================
      // STOCK RESERVATION LOGIC (Feature E.11)
      // ==========================================
      // Note: MOQ unit and Stock unit are enforced to be the same at product creation
      const currentStock =
        typeof product.stock === 'number'
          ? product.stock
          : parseFloat(String(product.stock));
      const requestedQty =
        typeof createTradeDto.quantity === 'number'
          ? createTradeDto.quantity
          : parseFloat(String(createTradeDto.quantity));

      if (!isNaN(currentStock) && !isNaN(requestedQty)) {
        if (requestedQty > currentStock) {
          throw new HttpException(
            `Insufficient stock. Only ${currentStock} ${product.stockUnit || ''} available.`,
            HttpStatus.BAD_REQUEST,
          );
        }

        // Use MongoDB's atomic $inc operator for stock deduction
        // This is reliable as it:
        // 1. Is truly atomic (no race conditions)
        // 2. Works regardless of BSON type (Int32, Double, etc.)
        // 3. Uses $gte to ensure sufficient stock in single operation
        const updatedProduct = await this.productModel.findOneAndUpdate(
          {
            _id: product._id,
            stock: { $gte: requestedQty }, // Ensure sufficient stock
          },
          { $inc: { stock: -requestedQty } }, // Atomic decrement
          { new: true },
        );

        if (!updatedProduct) {
          // Either product not found or insufficient stock
          // Re-check to provide accurate error message
          const currentProduct = await this.productModel.findById(product._id);
          if (!currentProduct) {
            throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
          }
          const latestStock =
            typeof currentProduct.stock === 'number'
              ? currentProduct.stock
              : parseFloat(String(currentProduct.stock));
          throw new HttpException(
            `Insufficient stock. Only ${latestStock} ${currentProduct.stockUnit || ''} available.`,
            HttpStatus.BAD_REQUEST,
          );
        }
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
        tradeStatus: 'pending',
      });

      try {
        const savedTrade = await trade.save();

        // Log audit event (non-blocking)
        this.auditService
          .logTradeCreated((savedTrade._id as any).toString(), buyerId, {
            productId: createTradeDto.productId,
            quantity: createTradeDto.quantity,
            offeredPrice: createTradeDto.buyerOfferedPrice,
            paymentMethod: createTradeDto.paymentMethod,
          })
          .catch((err) => console.error('Failed to create audit log:', err));

        // Send notification (non-blocking)
        const populatedTrade = await this.populateTradeForNotification(
          savedTrade._id as Types.ObjectId,
        );

        if (populatedTrade) {
          this.notificationService
            .notifyTradeCreated(populatedTrade as any)
            .catch((err) =>
              console.error('Failed to send trade created notification:', err),
            );
        }

        // Set unread flag for seller when buyer creates a new trade (PR)
        await this.setUnreadForOtherParty(
          (savedTrade._id as any).toString(),
          buyerId,
        );

        return {
          statusCode: 201,
          message: 'Trade request created successfully',
          data: savedTrade,
        };
      } catch (saveError) {
        // ROLLBACK STOCK if trade creation fails
        if (!isNaN(currentStock) && !isNaN(requestedQty)) {
          await this.productModel.findByIdAndUpdate(product._id, {
            $inc: { stock: requestedQty }, // Atomic increment to restore
          });
        }
        throw saveError;
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create trade request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      const trades = await this.tradeModel
        .find({
          buyer: new Types.ObjectId(userId),
        })
        .populate('product', 'name price currency productImages testReports')
        .populate({
          path: 'seller',
          select: 'mail company',
          populate: {
            path: 'company',
            select: '_id companyName profilePicture',
          },
        })
        .populate({
          path: 'buyer',
          select: 'mail company',
          populate: {
            path: 'company',
            select: '_id companyName profilePicture',
          },
        })
        .sort({ createdAt: -1 });

      return {
        statusCode: 200,
        message: 'Trades retrieved successfully',
        data: trades,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve trades',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      const trades = await this.tradeModel
        .find({
          seller: new Types.ObjectId(userId),
        })
        .populate('product', 'name price currency productImages testReports')
        .populate({
          path: 'seller',
          select: 'mail company',
          populate: {
            path: 'company',
            select: '_id companyName profilePicture',
          },
        })
        .populate({
          path: 'buyer',
          select: 'mail company',
          populate: {
            path: 'company',
            select: '_id companyName profilePicture',
          },
        })
        .sort({ createdAt: -1 });

      return {
        statusCode: 200,
        message: 'Trades retrieved successfully',
        data: trades,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve trades',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      const trade = await this.tradeModel
        .findOne({
          _id: new Types.ObjectId(tradeId),
          $or: [
            { buyer: new Types.ObjectId(userId) },
            { seller: new Types.ObjectId(userId) },
          ],
        })
        .populate('product', 'name price currency productImages description')
        .populate({
          path: 'seller',
          select: 'mail company',
          populate: {
            path: 'company',
            select: '_id companyName profilePicture',
          },
        })
        .populate({
          path: 'buyer',
          select: 'mail company',
          populate: {
            path: 'company',
            select: '_id companyName profilePicture',
          },
        });

      if (!trade) {
        throw new HttpException(
          'Trade not found or access denied',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        statusCode: 200,
        message: 'Trade retrieved successfully',
        data: trade,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve trade',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async submitCounterOffer(
    tradeId: string,
    accountToken: string,
    counterOfferData: {
      offeredPrice?: string;
      offeredIncoterms?: any;
      message?: string;
    },
  ) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel.findById(tradeId);
      if (!trade) {
        throw new HttpException('Trade not found', HttpStatus.NOT_FOUND);
      }

      // Verify user is the seller
      const isSeller = trade.seller.toString() === userId;
      const isBuyer = trade.buyer.toString() === userId;

      if (!isSeller) {
        throw new HttpException(
          'Only the seller can submit counter-offers',
          HttpStatus.FORBIDDEN,
        );
      }

      // Check if negotiation is locked (buyer exhausted counters)
      if (trade.isNegotiationLocked) {
        throw new HttpException(
          'Negotiation locked. The buyer has used all counter opportunities. You can only Accept or Reject this trade.',
          HttpStatus.FORBIDDEN,
        );
      }

      // Issue #4 - Use state machine validation
      this.validateNegotiationTransition(
        trade.negotiationStatus,
        'counter',
        isSeller,
        isBuyer,
      );

      // Update trade with seller's counter-offer
      const newRound = (trade.currentNegotiationRound || 0) + 1;
      const parsedPrice = counterOfferData.offeredPrice
        ? parseFloat(counterOfferData.offeredPrice)
        : undefined;
      const historyEntry = {
        round: newRound,
        party: 'seller' as const,
        offeredPrice: parsedPrice,
        offeredIncoterms: counterOfferData.offeredIncoterms,
        message: counterOfferData.message,
        timestamp: new Date(),
      };

      trade.sellerOfferedPrice = parsedPrice;
      trade.sellerOfferedIncoterms = counterOfferData.offeredIncoterms;
      trade.sellerMessage = counterOfferData.message;
      trade.negotiationStatus = 'countered';
      trade.currentNegotiationRound = newRound;
      trade.negotiationHistory.push(historyEntry);

      const updatedTrade = await trade.save();

      // Issue #10 - Set unread flag for buyer (other party)
      await this.setUnreadForOtherParty(tradeId, userId);

      // Log audit event (non-blocking)
      const previousOffer = {
        buyerPrice: trade.buyerOfferedPrice,
        buyerIncoterms: trade.buyerIncoterms,
      };
      this.auditService
        .logCounterOffer(tradeId, userId, previousOffer, {
          offeredPrice: counterOfferData.offeredPrice,
          offeredIncoterms: counterOfferData.offeredIncoterms,
          message: counterOfferData.message,
          round: historyEntry.round,
        })
        .catch((err) => console.error('Failed to create audit log:', err));

      // Send notification (non-blocking)
      const populatedTrade = await this.populateTradeForNotification(tradeId);

      if (populatedTrade && counterOfferData.offeredPrice) {
        this.notificationService
          .notifyCounterOffer(
            populatedTrade as any,
            'seller',
            counterOfferData.offeredPrice,
          )
          .catch((err) =>
            console.error('Failed to send counter offer notification:', err),
          );
      }

      return {
        statusCode: 200,
        message: 'Counter-offer submitted successfully',
        data: updatedTrade,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to submit counter-offer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async buyerRespond(
    tradeId: string,
    accountToken: string,
    responseData: {
      offeredPrice?: string;
      offeredIncoterms?: any;
      message?: string;
    },
  ) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel.findById(tradeId);
      if (!trade) {
        throw new HttpException('Trade not found', HttpStatus.NOT_FOUND);
      }

      // Verify user is the buyer
      const isSeller = trade.seller.toString() === userId;
      const isBuyer = trade.buyer.toString() === userId;

      if (!isBuyer) {
        throw new HttpException(
          'Only the buyer can respond to counter-offers',
          HttpStatus.FORBIDDEN,
        );
      }

      // Issue #4 - Use state machine validation
      this.validateNegotiationTransition(
        trade.negotiationStatus,
        'respond',
        isSeller,
        isBuyer,
      );

      const newRound = (trade.currentNegotiationRound || 0) + 1;
      const parsedPrice = responseData.offeredPrice
        ? parseFloat(responseData.offeredPrice)
        : undefined;
      const historyEntry = {
        round: newRound,
        party: 'buyer' as const,
        offeredPrice: parsedPrice,
        offeredIncoterms: responseData.offeredIncoterms,
        message: responseData.message,
        timestamp: new Date(),
      };

      // Store previous state for audit
      const previousOffer = {
        sellerPrice: trade.sellerOfferedPrice,
        sellerIncoterms: trade.sellerOfferedIncoterms,
      };

      // ========================
      // COUNTER LIMIT TRACKING
      // ========================
      // Increment buyer counter count
      const currentCounterCount = (trade.buyerCounterCount || 0) + 1;
      const maxCounters = trade.maxBuyerCounters || 2;

      trade.buyerCounterCount = currentCounterCount;

      // Check if this is the last allowed counter
      if (currentCounterCount >= maxCounters) {
        trade.isNegotiationLocked = true;
        console.log(
          `[Negotiation] Trade ${tradeId}: Buyer reached max counters (${currentCounterCount}/${maxCounters}). Negotiation locked.`,
        );
      }

      trade.buyerOfferedPrice = parsedPrice;
      trade.buyerIncoterms = responseData.offeredIncoterms;
      trade.buyerMessage = responseData.message;
      trade.negotiationStatus = 'buyer_responded';
      trade.currentNegotiationRound = newRound;
      trade.negotiationHistory.push(historyEntry);

      const updatedTrade = await trade.save();

      // Issue #10 - Set unread flag for seller (other party)
      await this.setUnreadForOtherParty(tradeId, userId);

      // Log audit event (non-blocking)
      this.auditService
        .logBuyerResponse(tradeId, userId, previousOffer, {
          offeredPrice: responseData.offeredPrice,
          offeredIncoterms: responseData.offeredIncoterms,
          message: responseData.message,
          round: historyEntry.round,
        })
        .catch((err) => console.error('Failed to create audit log:', err));

      // Send notification (non-blocking)
      const populatedTrade = await this.populateTradeForNotification(tradeId);

      if (populatedTrade && responseData.offeredPrice) {
        this.notificationService
          .notifyCounterOffer(
            populatedTrade as any,
            'buyer',
            responseData.offeredPrice,
          )
          .catch((err) =>
            console.error('Failed to send buyer response notification:', err),
          );
      }

      // ========================
      // COUNTER LIMIT NOTIFICATIONS
      // ========================
      if (populatedTrade) {
        // If this was the first counter (1 remaining), send warning to buyer
        if (currentCounterCount === maxCounters - 1) {
          this.notificationService
            .notifyLastCounterWarning(
              populatedTrade as any,
              currentCounterCount,
              maxCounters,
            )
            .catch((err) =>
              console.error('Failed to send last counter warning:', err),
            );
        }

        // If negotiation is now locked, notify seller of final offer
        if (trade.isNegotiationLocked && responseData.offeredPrice) {
          this.notificationService
            .notifyFinalOffer(populatedTrade as any, responseData.offeredPrice)
            .catch((err) =>
              console.error('Failed to send final offer notification:', err),
            );
        }
      }

      return {
        statusCode: 200,
        message: 'Response submitted successfully',
        data: updatedTrade,
        // Include counter info in response for frontend
        counterInfo: {
          countersUsed: currentCounterCount,
          maxCounters: maxCounters,
          remainingCounters: Math.max(0, maxCounters - currentCounterCount),
          isLocked: trade.isNegotiationLocked,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to submit response',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async acceptTrade(tradeId: string, accountToken: string) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel.findById(tradeId);
      if (!trade) {
        throw new HttpException('Trade not found', HttpStatus.NOT_FOUND);
      }

      // Verify user is either buyer or seller
      const isSeller = trade.seller.toString() === userId;
      const isBuyer = trade.buyer.toString() === userId;

      if (!isSeller && !isBuyer) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Issue #4 - Use state machine validation
      // This validates both that the trade can be accepted AND that this party can accept at this stage
      this.validateNegotiationTransition(
        trade.negotiationStatus,
        'accept',
        isSeller,
        isBuyer,
      );

      // SECURITY FIX: Defense in depth - explicitly prevent self-acceptance (Audit Bug - Seller Self-Acceptance)
      // A party cannot accept their own offer/counter-offer/response
      if (trade.negotiationStatus === 'countered' && isSeller) {
        // Seller made the counter-offer, so seller cannot accept it
        throw new HttpException(
          'Seller cannot accept their own counter-offer. Wait for buyer response.',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (trade.negotiationStatus === 'buyer_responded' && isBuyer) {
        // Buyer submitted the response, so buyer cannot accept it
        throw new HttpException(
          'Buyer cannot accept their own response. Wait for seller decision.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Add acceptance to history
      const historyEntry = {
        round: (trade.currentNegotiationRound || 0) + 1,
        party: isSeller ? ('seller' as const) : ('buyer' as const),
        message: 'Accepted the trade terms',
        timestamp: new Date(),
      };

      trade.negotiationStatus = 'accepted';
      trade.purchaseRequestStatus = 'accepted';
      trade.acceptedAt = new Date();
      trade.negotiationHistory.push(historyEntry);

      const updatedTrade = await trade.save();

      // Log audit event (non-blocking)
      this.auditService
        .logTradeAccepted(tradeId, userId, {
          finalPrice: trade.sellerOfferedPrice || trade.buyerOfferedPrice,
          acceptedBy: isSeller ? 'seller' : 'buyer',
          acceptedAt: trade.acceptedAt,
        })
        .catch((err) => console.error('Failed to create audit log:', err));

      // Send notification (non-blocking)
      const populatedTrade = await this.populateTradeForNotification(tradeId);

      if (populatedTrade) {
        this.notificationService
          .notifyTradeAccepted(
            populatedTrade as any,
            isSeller ? 'seller' : 'buyer',
          )
          .catch((err) =>
            console.error('Failed to send trade accepted notification:', err),
          );
      }

      // Set unread flag for other party when trade is accepted
      await this.setUnreadForOtherParty(tradeId, userId);

      return {
        statusCode: 200,
        message: 'Trade accepted successfully',
        data: updatedTrade,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to accept trade',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async rejectTrade(tradeId: string, accountToken: string, reason?: string) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel.findById(tradeId);
      if (!trade) {
        throw new HttpException('Trade not found', HttpStatus.NOT_FOUND);
      }

      // Verify user is either buyer or seller
      const isSeller = trade.seller.toString() === userId;
      const isBuyer = trade.buyer.toString() === userId;

      if (!isSeller && !isBuyer) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Issue #4 - Use state machine validation
      this.validateNegotiationTransition(
        trade.negotiationStatus,
        'reject',
        isSeller,
        isBuyer,
      );

      // Add rejection to history
      const historyEntry = {
        round: (trade.currentNegotiationRound || 0) + 1,
        party: isSeller ? ('seller' as const) : ('buyer' as const),
        message: reason || 'Rejected the trade',
        timestamp: new Date(),
      };

      trade.negotiationStatus = 'rejected';
      trade.purchaseRequestStatus = 'rejected';
      trade.rejectionReason = reason;
      trade.rejectedAt = new Date();
      trade.negotiationHistory.push(historyEntry);

      // Restore Stock on Rejection
      await this.restoreStock(trade);

      const updatedTrade = await trade.save();

      // Log audit event (non-blocking)
      this.auditService
        .logTradeRejected(tradeId, userId, reason)
        .catch((err) => console.error('Failed to create audit log:', err));

      // Send notification (non-blocking)
      const populatedTrade = await this.populateTradeForNotification(tradeId);

      if (populatedTrade) {
        this.notificationService
          .notifyTradeRejected(
            populatedTrade as any,
            isSeller ? 'seller' : 'buyer',
            reason,
          )
          .catch((err) =>
            console.error('Failed to send trade rejected notification:', err),
          );
      }

      // Set unread flag for other party when trade is rejected
      await this.setUnreadForOtherParty(tradeId, userId);

      return {
        statusCode: 200,
        message: 'Trade rejected',
        data: updatedTrade,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to reject trade',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getNegotiationHistory(tradeId: string, accountToken: string) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel
        .findOne({
          _id: new Types.ObjectId(tradeId),
          $or: [
            { buyer: new Types.ObjectId(userId) },
            { seller: new Types.ObjectId(userId) },
          ],
        })
        .populate('buyer', 'mail')
        .populate('seller', 'mail');

      if (!trade) {
        throw new HttpException(
          'Trade not found or access denied',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        statusCode: 200,
        message: 'Negotiation history retrieved successfully',
        data: {
          tradeId: trade._id,
          negotiationStatus: trade.negotiationStatus,
          currentRound: trade.currentNegotiationRound,
          history: trade.negotiationHistory,
          buyerCurrentOffer: {
            price: trade.buyerOfferedPrice,
            incoterms: trade.buyerIncoterms,
            message: trade.buyerMessage,
          },
          sellerCurrentOffer: {
            price: trade.sellerOfferedPrice,
            incoterms: trade.sellerOfferedIncoterms,
            message: trade.sellerMessage,
          },
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve negotiation history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ========================
  // PHASE 2: Document Management Methods
  // ========================

  /**
   * Upload a document for a trade
   * Handles SCO, ICPO, SPA, BoL, and Payment Proof uploads
   */
  async uploadDocument(
    tradeId: string,
    accountToken: string,
    file: Express.Multer.File,
    documentType: DocumentType,
    metadata: any,
  ) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel.findById(tradeId);
      if (!trade) {
        throw new HttpException('Trade not found', HttpStatus.NOT_FOUND);
      }

      // Verify user access and document-specific permissions
      // Handle both ObjectId and populated objects (when populated, use ._id)
      const getSafeId = (field: any): string => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        if (field._id) return field._id.toString();
        return field.toString();
      };

      const isSeller = getSafeId(trade.seller) === userId;
      const isBuyer = getSafeId(trade.buyer) === userId;

      if (!isSeller && !isBuyer) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Validate permissions based on document type
      this.validateDocumentPermissions(documentType, isSeller, isBuyer, trade);

      // Validate prior documents are approved (block upload if any prior doc is rejected)
      this.validatePriorDocumentsApproved(trade, documentType);

      // ========================
      // PHASE 2 REFACTORING: Upload blocking and rejection limit checks
      // ========================

      // Check if document is pending review (status === 'uploaded')
      // Users cannot replace a document while it's waiting for approval
      const docFieldMapForPendingCheck: Record<string, string> = {
        sco: 'scoDocument',
        icpo: 'icpoDocument',
        spa: 'spaDocument',
        'signed-spa': 'signedSpaDocument',
        'payment-proof': 'paymentProof',
        bol: 'bolDocument',
      };
      const pendingCheckFieldName = docFieldMapForPendingCheck[documentType];
      const existingDocForPendingCheck = (trade as any)[
        pendingCheckFieldName
      ] as DocumentInfo | undefined;

      if (existingDocForPendingCheck?.status === 'uploaded') {
        throw new HttpException(
          'Cannot replace document while pending review. Please wait for approval or rejection.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check rejection count against max attempts
      const rejectionTrackingFieldName =
        REJECTION_TRACKING_FIELD_MAP[documentType];
      if (rejectionTrackingFieldName) {
        const rejectionTracking = (trade as any)[rejectionTrackingFieldName] as
          | DocumentRejectionTracking
          | undefined;
        const maxAttempts = DOCUMENT_MAX_ATTEMPTS[documentType] || 2;
        const currentRejections = rejectionTracking?.rejectionCount || 0;

        // If rejection count >= maxAttempts, uploads are blocked (trade should already be cancelled)
        if (currentRejections >= maxAttempts) {
          throw new HttpException(
            `Maximum upload attempts (${maxAttempts}) exceeded for ${documentType.toUpperCase()}. Trade has been cancelled.`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // ========================
      // END PHASE 2 REFACTORING
      // ========================

      // Get existing document to check if this is a first-time upload
      const documentFieldMap: Record<string, string> = {
        sco: 'scoDocument',
        icpo: 'icpoDocument',
        spa: 'spaDocument',
        'payment-proof': 'paymentProof',
        bol: 'bolDocument',
      };
      const fieldName = documentFieldMap[documentType];
      const isFirstUpload = !(trade as any)[fieldName];

      // Bug #5 Fix: For first-time uploads, acquire atomic lock to prevent race conditions
      // This ensures only one concurrent upload can proceed for the same document type
      if (isFirstUpload) {
        const lockAcquired = await this.tradeModel.findOneAndUpdate(
          {
            _id: tradeId,
            documentUploadInProgress: { $ne: true },
            [`${fieldName}`]: { $exists: false }, // Double-check no document exists
          },
          { $set: { documentUploadInProgress: true } },
          { new: true },
        );

        if (!lockAcquired) {
          throw new HttpException(
            'Another document upload is in progress. Please wait and try again.',
            HttpStatus.CONFLICT,
          );
        }
      }

      // Wrap the rest in try-finally to ensure lock is released
      let uploadResult: any;
      try {
        // Upload file to storage
        const folder = `trade-documents/${tradeId}/${documentType}`;
        const filePath = await this.storageService.upload(
          file.buffer,
          file.originalname,
          folder,
        );

        // Get existing document to handle versioning
        const existingDoc = this.getExistingDocument(trade, documentType);
        const currentVersion = existingDoc?.version || 1;
        const newVersion = existingDoc ? currentVersion + 1 : 1;

        // Build history array - preserve previous versions
        let history: DocumentVersion[] = existingDoc?.history || [];
        if (existingDoc) {
          // Move current document to history
          const historyEntry: DocumentVersion = {
            filePath: existingDoc.filePath,
            originalName: existingDoc.originalName,
            mimeType: existingDoc.mimeType,
            size: existingDoc.size,
            uploadedAt: existingDoc.uploadedAt,
            uploadedBy: existingDoc.uploadedBy,
            version: currentVersion,
          };
          history = [...history, historyEntry];
        }

        // Create document info object with versioning
        const documentInfo: DocumentInfo = {
          filePath,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: new Date(),
          uploadedBy: new Types.ObjectId(userId),
          status: 'uploaded',
          notes: metadata?.notes,
          version: newVersion,
          history: history,
        };

        // Update trade with document and advance phase
        const updateData: any = {};
        let newPhase: TradePhase | null = null;
        const invalidatedDocuments: string[] = [];

        switch (documentType) {
          case 'sco':
            updateData.scoDocument = documentInfo;
            updateData.scoSubmittedAt = new Date();
            newPhase = 'SCO';

            // If SCO is being replaced (version > 1), invalidate subsequent documents
            if (newVersion > 1) {
              // Clear ICPO and all subsequent documents
              if (trade.icpoDocument) {
                updateData.icpoDocument = null;
                updateData.icpoSubmittedAt = null;
                invalidatedDocuments.push('ICPO');
              }
              if (trade.spaDocument) {
                updateData.spaDocument = null;
                updateData.spaSignedAt = null;
                invalidatedDocuments.push('SPA');
              }
              if (trade.paymentProof) {
                updateData.paymentProof = null;
                updateData.paymentVerifiedAt = null;
                invalidatedDocuments.push('Payment Proof');
              }
              if (trade.bolDocument) {
                updateData.bolDocument = null;
                updateData.bolUploadedAt = null;
                invalidatedDocuments.push('BoL');
              }
              // Reset trade phase to SCO
              updateData.tradePhase = 'SCO';
            }
            break;
          case 'icpo':
            updateData.icpoDocument = documentInfo;
            updateData.icpoSubmittedAt = new Date();
            newPhase = 'ICPO';

            // If ICPO is being replaced, invalidate subsequent documents
            if (newVersion > 1) {
              if (trade.spaDocument) {
                updateData.spaDocument = null;
                updateData.spaSignedAt = null;
                invalidatedDocuments.push('SPA');
              }
              if (trade.paymentProof) {
                updateData.paymentProof = null;
                updateData.paymentVerifiedAt = null;
                invalidatedDocuments.push('Payment Proof');
              }
              if (trade.bolDocument) {
                updateData.bolDocument = null;
                updateData.bolUploadedAt = null;
                invalidatedDocuments.push('BoL');
              }
              // Reset trade phase to ICPO
              updateData.tradePhase = 'ICPO';
            }
            break;
          case 'spa':
            updateData.spaDocument = documentInfo;
            updateData.spaUploadedAt = new Date();
            newPhase = 'SPA';
            // NOTE: Trade stays in SPA phase until BOTH parties sign
            // Phase advances to PAYMENT only after both signatures
            break;
          case 'bol':
            updateData.bolDocument = documentInfo;
            updateData.bolUploadedAt = new Date();
            newPhase = 'BOL';
            break;
          case 'payment-proof':
            updateData.paymentProof = documentInfo;
            updateData.paymentVerifiedAt = new Date();
            newPhase = 'BOL'; // Advance to BOL phase so seller can upload Bill of Lading
            break;
        }

        // Update trade phase if appropriate (only if not already set by invalidation logic)
        if (
          newPhase &&
          !updateData.tradePhase &&
          this.shouldAdvancePhase(trade.tradePhase, newPhase)
        ) {
          updateData.tradePhase = newPhase;
        }

        // Issue #3 - Use Optimistic Concurrency Control (OCC) to prevent race conditions
        // Note: fieldName is already defined earlier in this method

        // If replacing an existing document, verify the version matches what we read
        const queryCondition: any = { _id: tradeId };
        if (existingDoc && existingDoc.version) {
          // OCC: Only update if the version is still what we expect
          queryCondition[`${fieldName}.version`] = currentVersion;
        }

        const updatedTrade = await this.tradeModel.findOneAndUpdate(
          queryCondition,
          { $set: updateData },
          { new: true },
        );

        // Issue #3 - If no document was updated, it means another request modified it first
        if (!updatedTrade && existingDoc) {
          throw new HttpException(
            'Document was modified by another request. Please refresh and try again.',
            HttpStatus.CONFLICT,
          );
        }

        // Log audit event (non-blocking)
        this.auditService
          .logDocumentUploaded(tradeId, userId, documentType, {
            filePath: documentInfo.filePath,
            originalName: documentInfo.originalName,
            mimeType: documentInfo.mimeType,
            size: documentInfo.size,
            uploadedBy: isSeller ? 'seller' : 'buyer',
            newPhase,
            isReplacement: newVersion > 1,
            invalidatedDocuments:
              invalidatedDocuments.length > 0
                ? invalidatedDocuments
                : undefined,
          })
          .catch((err) => console.error('Failed to create audit log:', err));

        // Send notification (non-blocking)
        const populatedTrade = await this.populateTradeForNotification(tradeId);

        if (populatedTrade) {
          // Notify about the document upload
          this.notificationService
            .notifyDocumentUploaded(
              populatedTrade as any,
              documentType.toUpperCase(),
              isSeller ? 'seller' : 'buyer',
            )
            .catch((err) =>
              console.error(
                'Failed to send document uploaded notification:',
                err,
              ),
            );

          // If documents were invalidated, send additional notification to the affected party
          if (invalidatedDocuments.length > 0) {
            this.notificationService
              .notifyDocumentsInvalidated(
                populatedTrade as any,
                documentType.toUpperCase(),
                invalidatedDocuments,
              )
              .catch((err) =>
                console.error(
                  'Failed to send documents invalidated notification:',
                  err,
                ),
              );
          }
        }

        // Issue #10 - Set unread flag for other party after document upload
        await this.setUnreadForOtherParty(tradeId, userId);

        // Build response message
        let responseMessage = `${documentType.toUpperCase()} document uploaded successfully`;
        if (invalidatedDocuments.length > 0) {
          responseMessage += `. The following documents have been invalidated and need to be re-submitted: ${invalidatedDocuments.join(', ')}`;
        }

        uploadResult = {
          statusCode: 200,
          message: responseMessage,
          data: {
            trade: updatedTrade,
            document: documentInfo,
            invalidatedDocuments:
              invalidatedDocuments.length > 0
                ? invalidatedDocuments
                : undefined,
          },
        };
      } finally {
        // Bug #5 Fix: Always release the lock after first-time upload attempt
        // SECURITY FIX: Wrap lock release in try-catch to prevent stuck locks (Audit Bug #3.1)
        if (isFirstUpload) {
          try {
            await this.tradeModel.findByIdAndUpdate(tradeId, {
              $set: { documentUploadInProgress: false },
            });
          } catch (lockReleaseError) {
            // Log error but don't mask the original exception
            console.error(
              `CRITICAL: Failed to release document upload lock for trade ${tradeId}:`,
              lockReleaseError,
            );
            // Attempt a second release using unset as fallback
            try {
              await this.tradeModel.findByIdAndUpdate(tradeId, {
                $unset: { documentUploadInProgress: '' },
              });
            } catch {
              console.error(
                `CRITICAL: Fallback lock release also failed for trade ${tradeId}`,
              );
            }
          }
        }
      }

      return uploadResult;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to upload document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ========================
   * PHASE 2 REFACTORING: Upload Signed SPA (New SPA Flow)
   * ========================
   * Buyer uploads their signed copy of the SPA after seller's SPA is approved
   * Flow: Seller uploads SPA → Buyer approves → Buyer uploads signed SPA → Seller approves → PAYMENT phase
   */
  async uploadSignedSpa(
    tradeId: string,
    accountToken: string,
    file: Express.Multer.File,
    metadata: any,
  ) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel.findById(tradeId);
      if (!trade) {
        throw new HttpException('Trade not found', HttpStatus.NOT_FOUND);
      }

      // Verify user access - ONLY buyers can upload signed SPA
      const isSeller = trade.seller.toString() === userId;
      const isBuyer = trade.buyer.toString() === userId;

      if (!isSeller && !isBuyer) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      if (!isBuyer) {
        throw new HttpException(
          'Only buyers can upload signed SPA',
          HttpStatus.FORBIDDEN,
        );
      }

      // Validate negotiation is accepted
      if (trade.negotiationStatus !== 'accepted') {
        throw new HttpException(
          'Cannot upload documents before negotiation is accepted',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate seller's SPA exists and is approved
      if (!trade.spaDocument) {
        throw new HttpException(
          'Seller must upload SPA first',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (trade.spaDocument.status !== 'approved') {
        throw new HttpException(
          "Seller's SPA must be approved before uploading signed SPA",
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if signed SPA is pending review
      if (trade.signedSpaDocument?.status === 'uploaded') {
        throw new HttpException(
          'Cannot replace signed SPA while pending review. Please wait for approval or rejection.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check rejection limit
      const maxAttempts = DOCUMENT_MAX_ATTEMPTS['signed-spa'] || 2;
      const currentRejections =
        trade.signedSpaRejectionTracking?.rejectionCount || 0;

      if (currentRejections >= maxAttempts) {
        throw new HttpException(
          `Maximum upload attempts (${maxAttempts}) exceeded for signed SPA. Trade has been cancelled.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Upload file to storage
      const folder = `trade-documents/${tradeId}/signed-spa`;
      const filePath = await this.storageService.upload(
        file.buffer,
        file.originalname,
        folder,
      );

      // Handle versioning for signed SPA
      const existingDoc = trade.signedSpaDocument;
      const currentVersion = existingDoc?.version || 1;
      const newVersion = existingDoc ? currentVersion + 1 : 1;

      // Build history array
      let history: DocumentVersion[] = existingDoc?.history || [];
      if (existingDoc) {
        const historyEntry: DocumentVersion = {
          filePath: existingDoc.filePath,
          originalName: existingDoc.originalName,
          mimeType: existingDoc.mimeType,
          size: existingDoc.size,
          uploadedAt: existingDoc.uploadedAt,
          uploadedBy: existingDoc.uploadedBy,
          version: currentVersion,
        };
        history = [...history, historyEntry];
      }

      // Create document info
      const documentInfo: DocumentInfo = {
        filePath,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
        uploadedBy: new Types.ObjectId(userId),
        status: 'uploaded',
        notes: metadata?.notes,
        version: newVersion,
        history,
      };

      // Update trade
      trade.signedSpaDocument = documentInfo;
      trade.signedSpaSubmittedAt = new Date();
      trade.markModified('signedSpaDocument');

      const updatedTrade = await trade.save();

      // Log audit event (non-blocking)
      this.auditService
        .logDocumentUploaded(tradeId, userId, 'signed-spa', {
          filename: file.originalname,
          version: newVersion,
          fileSize: file.size,
        })
        .catch((err) => console.error('Failed to create audit log:', err));

      // Send notification (non-blocking)
      const populatedTrade = await this.populateTradeForNotification(tradeId);

      if (populatedTrade) {
        this.notificationService
          .notifyDocumentUploaded(populatedTrade as any, 'SIGNED-SPA', 'buyer')
          .catch((err) =>
            console.error(
              'Failed to send document uploaded notification:',
              err,
            ),
          );
      }

      // Set unread flag for seller
      await this.setUnreadForOtherParty(tradeId, userId);

      return {
        statusCode: 200,
        message:
          'Signed SPA document uploaded successfully. Waiting for seller approval.',
        data: {
          trade: updatedTrade,
          document: documentInfo,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to upload signed SPA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all documents for a trade
   */
  async getTradeDocuments(tradeId: string, accountToken: string) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel.findOne({
        _id: new Types.ObjectId(tradeId),
        $or: [
          { buyer: new Types.ObjectId(userId) },
          { seller: new Types.ObjectId(userId) },
        ],
      });

      if (!trade) {
        throw new HttpException(
          'Trade not found or access denied',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        statusCode: 200,
        message: 'Trade documents retrieved successfully',
        data: {
          tradeId: trade._id,
          tradePhase: trade.tradePhase,
          documents: {
            sco: trade.scoDocument || null,
            icpo: trade.icpoDocument || null,
            spa: trade.spaDocument || null,
            signedSpa: trade.signedSpaDocument || null, // PHASE 2: Buyer's signed SPA
            bol: trade.bolDocument || null,
            paymentProof: trade.paymentProof || null,
          },
          timestamps: {
            scoSubmittedAt: trade.scoSubmittedAt,
            icpoSubmittedAt: trade.icpoSubmittedAt,
            spaUploadedAt: trade.spaUploadedAt,
            spaSellerSignedAt: trade.spaSellerSignedAt,
            spaBuyerSignedAt: trade.spaBuyerSignedAt,
            signedSpaSubmittedAt: trade.signedSpaSubmittedAt, // PHASE 2
            signedSpaApprovedAt: trade.signedSpaApprovedAt, // PHASE 2
            paymentVerifiedAt: trade.paymentVerifiedAt,
            bolUploadedAt: trade.bolUploadedAt,
            completedAt: trade.completedAt,
            autoCancelledAt: trade.autoCancelledAt, // PHASE 2
            disputeEligibilityEndsAt: trade.disputeEligibilityEndsAt, // PHASE 2
          },
          // SPA signature status for frontend (legacy - kept for backward compatibility)
          spaStatus: trade.spaDocument
            ? {
                uploaded: !!trade.spaDocument.filePath,
                sellerSigned: !!(trade.spaDocument as any)
                  .sellerSignatureDataUrl,
                buyerSigned: !!(trade.spaDocument as any).buyerSignatureDataUrl,
                fullySigned:
                  !!(trade.spaDocument as any).sellerSignatureDataUrl &&
                  !!(trade.spaDocument as any).buyerSignatureDataUrl,
              }
            : null,
          // PHASE 2: New SPA approval status
          spaApprovalStatus: {
            spaUploaded: !!trade.spaDocument?.filePath,
            spaApproved: trade.spaDocument?.status === 'approved',
            signedSpaUploaded: !!trade.signedSpaDocument?.filePath,
            signedSpaApproved: trade.signedSpaDocument?.status === 'approved',
          },
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve trade documents',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get document for download - streams the file
   */
  async getDocumentForDownload(
    tradeId: string,
    accountToken: string,
    documentType:
      | 'sco'
      | 'icpo'
      | 'spa'
      | 'signed-spa'
      | 'bol'
      | 'payment-proof',
  ) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel.findOne({
        _id: new Types.ObjectId(tradeId),
        $or: [
          { buyer: new Types.ObjectId(userId) },
          { seller: new Types.ObjectId(userId) },
        ],
      });

      if (!trade) {
        throw new HttpException(
          'Trade not found or access denied',
          HttpStatus.NOT_FOUND,
        );
      }

      // Determine user role
      const isSeller = trade.seller.toString() === userId;
      const isBuyer = trade.buyer.toString() === userId;

      // SECURITY FIX: Validate document access based on trade phase (Audit Bug - Document Authorization)
      this.validateDocumentAccess(documentType, trade, isSeller, isBuyer);

      // Map document type to schema field
      const documentFieldMap: Record<string, keyof Trade> = {
        sco: 'scoDocument',
        icpo: 'icpoDocument',
        spa: 'spaDocument',
        bol: 'bolDocument',
        'payment-proof': 'paymentProof',
      };

      const documentField = documentFieldMap[documentType];
      const document = trade[documentField] as DocumentInfo | undefined;

      if (!document || !document.filePath) {
        throw new HttpException(
          `No ${documentType.toUpperCase()} document found for this trade`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Get the file stream from storage service
      const stream = await this.storageService.getFileStream(document.filePath);

      return {
        statusCode: 200,
        message: 'Document ready for download',
        data: {
          stream,
          filename: document.originalName || `${documentType}-document`,
          mimeType: document.mimeType || 'application/octet-stream',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to download document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Advance trade to a specific phase
   */
  async advanceTradePhase(
    tradeId: string,
    accountToken: string,
    newPhase: TradePhase,
  ) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel.findOne({
        _id: new Types.ObjectId(tradeId),
        $or: [
          { buyer: new Types.ObjectId(userId) },
          { seller: new Types.ObjectId(userId) },
        ],
      });

      if (!trade) {
        throw new HttpException(
          'Trade not found or access denied',
          HttpStatus.NOT_FOUND,
        );
      }

      // Validate phase transition
      if (!this.isValidPhaseTransition(trade.tradePhase, newPhase)) {
        throw new HttpException(
          `Invalid phase transition from ${trade.tradePhase} to ${newPhase}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Issue #9 - Validate required documents exist for each phase transition
      this.validatePhaseTransitionDocuments(trade, newPhase);

      const previousPhase = trade.tradePhase;
      trade.tradePhase = newPhase;
      const updatedTrade = await trade.save();

      // Log audit event (non-blocking)
      this.auditService
        .logPhaseAdvanced(tradeId, userId, previousPhase, newPhase)
        .catch((err) => console.error('Failed to create audit log:', err));

      // Send notification (non-blocking)
      const populatedTrade = await this.populateTradeForNotification(tradeId);

      if (populatedTrade) {
        this.notificationService
          .notifyPhaseAdvanced(populatedTrade as any, newPhase)
          .catch((err) =>
            console.error('Failed to send phase advanced notification:', err),
          );
      }

      return {
        statusCode: 200,
        message: `Trade phase advanced to ${newPhase}`,
        data: updatedTrade,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to advance trade phase',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Complete a trade
   * Only the BUYER can complete a trade after receiving and verifying the BoL
   * This confirms the buyer has received the goods as per the agreement
   */
  async completeTrade(tradeId: string, accountToken: string) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel.findOne({
        _id: new Types.ObjectId(tradeId),
        $or: [
          { buyer: new Types.ObjectId(userId) },
          { seller: new Types.ObjectId(userId) },
        ],
      });

      if (!trade) {
        throw new HttpException(
          'Trade not found or access denied',
          HttpStatus.NOT_FOUND,
        );
      }

      // Only buyers can complete the trade (they verify receipt of goods)
      const isBuyer = trade.buyer.toString() === userId;
      if (!isBuyer) {
        throw new HttpException(
          'Only the buyer can complete the trade after verifying receipt of goods',
          HttpStatus.FORBIDDEN,
        );
      }

      // Verify trade can be completed (must be in BOL phase with all documents)
      if (trade.tradePhase !== 'BOL') {
        throw new HttpException(
          'Trade must be in BOL phase to be completed',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verify BoL document exists
      if (!trade.bolDocument) {
        throw new HttpException(
          'Bill of Lading must be uploaded before completing the trade',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Issue #11 - Additional validation for trade completion
      // Verify payment proof exists and is verified
      if (!trade.paymentProof) {
        throw new HttpException(
          'Payment proof must be uploaded before completing the trade',
          HttpStatus.BAD_REQUEST,
        );
      }

      // ========================
      // PHASE 2 REFACTORING: Updated SPA validation for new flow
      // ========================
      // Check new flow first: signedSpaDocument approved
      if (trade.signedSpaDocument) {
        if (trade.signedSpaDocument.status !== 'approved') {
          throw new HttpException(
            'Signed SPA must be approved before completing the trade',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        // Legacy fallback: Check dual signatures for existing trades
        if (
          !trade.spaDocument?.sellerSignatureDataUrl ||
          !trade.spaDocument?.buyerSignatureDataUrl
        ) {
          throw new HttpException(
            'SPA process must be completed before completing the trade',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Issue #1 - Synchronize all status fields on completion
      const now = new Date();
      trade.tradePhase = 'COMPLETED';
      trade.completedAt = now;

      // ========================
      // PHASE 2 REFACTORING: Set 30-day dispute eligibility window
      // ========================
      trade.disputeEligibilityEndsAt = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000,
      );
      trade.lastPhaseChangeAt = now;
      trade.purchaseOrderStatus = 'completed';
      // Note: negotiationStatus stays as 'accepted' - it's already in terminal state
      trade.purchaseRequestStatus = 'completed'; // Sync purchase request status

      const updatedTrade = await trade.save();

      // Log audit event (non-blocking)
      const totalAmount =
        trade.sellerOfferedPrice || trade.buyerOfferedPrice || '0';

      this.auditService
        .logTradeCompleted(tradeId, userId, {
          completedAt: trade.completedAt,
          totalAmount,
          finalPhase: 'COMPLETED',
        })
        .catch((err) => console.error('Failed to create audit log:', err));

      // Send notification (non-blocking)
      const populatedTrade = await this.populateTradeForNotification(tradeId);

      if (populatedTrade) {
        // Calculate total amount from negotiated price or buyer offered price
        const notifyAmount =
          populatedTrade.sellerOfferedPrice ||
          populatedTrade.buyerOfferedPrice ||
          (populatedTrade.product as any)?.price ||
          '0';

        this.notificationService
          .notifyTradeCompleted(populatedTrade as any, notifyAmount)
          .catch((err) =>
            console.error('Failed to send trade completed notification:', err),
          );
      }

      // FIX: Invalidate analytics cache for both buyer and seller companies
      // This ensures analytics data updates immediately after trade completion
      const buyerCompanyId = (decodedToken as any).companyId;
      if (buyerCompanyId) {
        this.analyticsService
          .invalidateCompanyCache(buyerCompanyId)
          .catch((err) =>
            console.error('Failed to invalidate buyer analytics cache:', err),
          );
      }

      // Get seller's company and invalidate their cache too
      const sellerUser = await this.userModel
        .findById(trade.seller)
        .select('company')
        .lean();
      if (sellerUser?.company) {
        this.analyticsService
          .invalidateCompanyCache(sellerUser.company.toString())
          .catch((err) =>
            console.error('Failed to invalidate seller analytics cache:', err),
          );
      }

      return {
        statusCode: 200,
        message: 'Trade completed successfully',
        data: updatedTrade,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to complete trade',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Verify or reject a document
   * Different documents are verified by different parties
   */
  async verifyDocument(
    tradeId: string,
    accountToken: string,
    documentType: DocumentType,
    status: 'approved' | 'rejected',
    notes?: string,
  ) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel.findById(tradeId);
      if (!trade) {
        throw new HttpException('Trade not found', HttpStatus.NOT_FOUND);
      }

      // Verify user access
      const isSeller = trade.seller.toString() === userId;
      const isBuyer = trade.buyer.toString() === userId;

      if (!isSeller && !isBuyer) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Validate verification permissions based on document type
      // SCO → Buyer verifies, ICPO → Seller verifies
      // Payment Proof → Seller verifies, BoL → Buyer verifies
      // SPA → Either party can reject (approval via dual signatures only)
      this.validateVerificationPermissions(
        documentType,
        isSeller,
        isBuyer,
        status,
      );

      // Get the document field name
      // PHASE 2 REFACTORING: Added 'signed-spa' type
      const documentFieldMap: Record<string, keyof Trade> = {
        sco: 'scoDocument',
        icpo: 'icpoDocument',
        spa: 'spaDocument',
        'signed-spa': 'signedSpaDocument',
        bol: 'bolDocument',
        'payment-proof': 'paymentProof',
      };

      const fieldName = documentFieldMap[documentType];
      if (!fieldName) {
        throw new HttpException(
          `Unknown document type: ${documentType}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      const document = trade[fieldName] as DocumentInfo | undefined;

      if (!document) {
        throw new HttpException(
          `${documentType.toUpperCase()} document not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      // Update the document status
      document.status = status;
      if (notes) {
        document.notes = notes;
      }

      // Special handling for SPA rejection - clear signatures (legacy support)
      if (documentType === 'spa' && status === 'rejected') {
        (document as any).sellerSignatureDataUrl = null;
        (document as any).buyerSignatureDataUrl = null;
      }

      trade.markModified(fieldName);

      // ========================
      // PHASE 2 REFACTORING: Rejection Tracking
      // ========================
      let autoCancelled = false;
      let remainingAttempts = 0;

      if (status === 'rejected') {
        const rejectionTrackingFieldName =
          REJECTION_TRACKING_FIELD_MAP[documentType];
        if (rejectionTrackingFieldName) {
          const maxAttempts = DOCUMENT_MAX_ATTEMPTS[documentType] || 2;
          let rejectionTracking = (trade as any)[
            rejectionTrackingFieldName
          ] as DocumentRejectionTracking;

          // Initialize if not present
          if (!rejectionTracking) {
            rejectionTracking = { rejectionCount: 0, maxAttempts };
          }

          // Increment rejection count
          rejectionTracking.rejectionCount += 1;
          rejectionTracking.lastRejectionAt = new Date();
          rejectionTracking.lastRejectionReason = notes || 'No reason provided';
          rejectionTracking.maxAttempts = maxAttempts;

          // Update the tracking field
          (trade as any)[rejectionTrackingFieldName] = rejectionTracking;
          trade.markModified(rejectionTrackingFieldName as string);

          // Calculate remaining attempts
          remainingAttempts = maxAttempts - rejectionTracking.rejectionCount;

          // Check if max attempts exceeded → auto-cancel
          if (remainingAttempts <= 0) {
            autoCancelled = true;
            await this.autoCancelTrade(
              trade,
              `Maximum upload attempts (${maxAttempts}) exceeded for ${documentType.toUpperCase()}`,
            );
          }
        }
      }

      // If auto-cancelled, skip phase advancement and return early
      if (autoCancelled) {
        return {
          statusCode: 200,
          message: `Document rejected. Trade has been automatically cancelled due to exceeding maximum upload attempts.`,
          data: {
            trade,
            document: trade[fieldName],
            autoCancelled: true,
            newPhase: 'CANCELLED',
          },
        };
      }
      // ========================
      // END PHASE 2 REFACTORING
      // ========================

      // If document is approved, advance to the next phase
      let phaseAdvanced = false;
      if (status === 'approved') {
        // ========================
        // PHASE 2 REFACTORING: Updated phase advance map
        // ========================
        // New SPA flow: SPA approval does NOT advance phase (waits for signed SPA)
        // signed-spa approval advances to PAYMENT phase
        const phaseAdvanceMap: Record<string, TradePhase> = {
          sco: 'ICPO', // SCO approved → ICPO phase
          icpo: 'SPA', // ICPO approved → SPA phase (ready for SPA upload)
          // 'spa' approval: No phase change - buyer now uploads signed SPA
          'signed-spa': 'PAYMENT', // Signed SPA approved → PAYMENT phase (NEW)
          'payment-proof': 'BOL', // Payment approved → BoL phase
        };

        const nextPhase = phaseAdvanceMap[documentType];
        if (nextPhase && this.shouldAdvancePhase(trade.tradePhase, nextPhase)) {
          trade.tradePhase = nextPhase;
          trade.lastPhaseChangeAt = new Date(); // Track phase change time
          phaseAdvanced = true;
        }

        // Special handling: When signed SPA is approved, also set the approval timestamp
        if (documentType === 'signed-spa') {
          trade.signedSpaApprovedAt = new Date();
        }
      }

      // Save the updated trade
      const updatedTrade = await trade.save();

      // Log audit event (non-blocking)
      this.auditService
        .logDocumentVerified(tradeId, userId, documentType, status, notes)
        .catch((err) => console.error('Failed to create audit log:', err));

      // Send notifications based on action
      const populatedTrade = await this.populateTradeForNotification(tradeId);

      if (phaseAdvanced && populatedTrade) {
        // If phase was advanced, send notification
        this.notificationService
          .notifyPhaseAdvanced(populatedTrade as any, trade.tradePhase)
          .catch((err) =>
            console.error('Failed to send phase advanced notification:', err),
          );
      }

      // ========================
      // PHASE 2 REFACTORING: Send signed SPA required notification
      // ========================
      // When seller's SPA is approved, prompt buyer to upload their signed copy
      if (documentType === 'spa' && status === 'approved' && populatedTrade) {
        this.notificationService
          .notifySignedSpaRequired(populatedTrade as any)
          .catch((err) =>
            console.error(
              'Failed to send signed SPA required notification:',
              err,
            ),
          );
      }

      // ========================
      // PHASE 2 REFACTORING: Send rejection notifications
      // ========================
      if (status === 'rejected' && populatedTrade) {
        // Send document rejected notification with remaining attempts
        this.notificationService
          .notifyDocumentRejected(
            populatedTrade as any,
            documentType,
            notes || 'No reason provided',
            remainingAttempts,
          )
          .catch((err) =>
            console.error(
              'Failed to send document rejection notification:',
              err,
            ),
          );

        // If this is the last attempt, send warning
        if (remainingAttempts === 1) {
          this.notificationService
            .notifyLastAttemptWarning(populatedTrade as any, documentType)
            .catch((err) =>
              console.error('Failed to send last attempt warning:', err),
            );
        }
      }

      // Set unread flag for the document uploader when their document is verified
      await this.setUnreadForOtherParty(tradeId, userId);

      // Build response message
      let message = `Document ${status === 'approved' ? 'approved' : 'rejected'} successfully`;
      if (phaseAdvanced) {
        message += `. Trade advanced to ${trade.tradePhase} phase.`;
      }
      if (status === 'rejected' && remainingAttempts > 0) {
        message += ` ${remainingAttempts} upload attempt(s) remaining.`;
      }

      return {
        statusCode: 200,
        message,
        data: {
          trade: updatedTrade,
          document: updatedTrade[fieldName],
          phaseAdvanced,
          newPhase: phaseAdvanced ? trade.tradePhase : undefined,
          // Phase 2 refactoring: Include rejection info
          rejectionInfo:
            status === 'rejected'
              ? {
                  remainingAttempts,
                  maxAttempts: DOCUMENT_MAX_ATTEMPTS[documentType] || 2,
                  isLastAttempt: remainingAttempts === 1,
                }
              : undefined,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to verify document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sign a document with e-signature
   * SCO → Seller signs, ICPO → Buyer signs, SPA → BOTH parties must sign, BoL → Seller signs
   */
  async signDocument(
    tradeId: string,
    accountToken: string,
    documentType: DocumentType,
    signatureDataUrl: string,
  ) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel.findById(tradeId);
      if (!trade) {
        throw new HttpException('Trade not found', HttpStatus.NOT_FOUND);
      }

      // Verify user access
      const isSeller = trade.seller.toString() === userId;
      const isBuyer = trade.buyer.toString() === userId;

      if (!isSeller && !isBuyer) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Validate signing permissions
      this.validateSigningPermissions(documentType, isSeller, isBuyer, trade);

      // Get document field
      const documentFieldMap: Record<DocumentType, keyof Trade> = {
        sco: 'scoDocument',
        icpo: 'icpoDocument',
        spa: 'spaDocument',
        'signed-spa': 'signedSpaDocument',
        bol: 'bolDocument',
        'payment-proof': 'paymentProof',
      };

      const fieldName = documentFieldMap[documentType];
      const document = trade[fieldName];

      if (!document || !document.filePath) {
        throw new HttpException(
          `${documentType.toUpperCase()} document must be uploaded before signing`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Handle SPA specially - requires BOTH signatures
      if (documentType === 'spa') {
        // Issue #2 - Create new object reference to ensure Mongoose detects changes
        // Spreading creates a new object, forcing Mongoose to recognize it as modified
        let updatedDoc = { ...document };

        if (isSeller) {
          // Check if seller already signed
          if (document.sellerSignatureDataUrl) {
            throw new HttpException(
              'Seller has already signed the SPA',
              HttpStatus.BAD_REQUEST,
            );
          }
          updatedDoc = {
            ...updatedDoc,
            sellerSignatureDataUrl: signatureDataUrl,
            sellerSignedAt: new Date(),
            sellerSignedBy: new Types.ObjectId(userId),
          };
          trade.spaSellerSignedAt = new Date();
        } else if (isBuyer) {
          // Check if buyer already signed
          if (document.buyerSignatureDataUrl) {
            throw new HttpException(
              'Buyer has already signed the SPA',
              HttpStatus.BAD_REQUEST,
            );
          }
          updatedDoc = {
            ...updatedDoc,
            buyerSignatureDataUrl: signatureDataUrl,
            buyerSignedAt: new Date(),
            buyerSignedBy: new Types.ObjectId(userId),
          };
          trade.spaBuyerSignedAt = new Date();
        }

        // Check if BOTH have now signed - advance to PAYMENT phase
        if (
          updatedDoc.sellerSignatureDataUrl &&
          updatedDoc.buyerSignatureDataUrl
        ) {
          updatedDoc = { ...updatedDoc, status: 'approved' };
          trade.tradePhase = 'PAYMENT';
        }

        // Issue #2 - Assign new object reference to ensure Mongoose detects the change
        trade.spaDocument = updatedDoc;
      } else {
        // For other documents, single signature
        // Issue #2 - Create new object reference
        const updatedDoc = {
          ...document,
          signatureDataUrl: signatureDataUrl,
          signedAt: new Date(),
          signedBy: new Types.ObjectId(userId),
        };

        // Assign new object reference based on document type
        switch (documentType) {
          case 'sco':
            trade.scoDocument = updatedDoc;
            break;
          case 'icpo':
            trade.icpoDocument = updatedDoc;
            break;
          case 'bol':
            trade.bolDocument = updatedDoc;
            break;
        }
      }

      // Mark the document field as modified so Mongoose saves nested changes
      trade.markModified(fieldName as string);

      // Log what we're saving for debugging
      console.log(`Signing ${documentType} document for trade ${tradeId}`);
      console.log(`User is ${isSeller ? 'seller' : 'buyer'}`);
      if (documentType === 'spa') {
        console.log(
          `SPA sellerSignatureDataUrl: ${trade.spaDocument?.sellerSignatureDataUrl ? 'SET' : 'NOT SET'}`,
        );
        console.log(
          `SPA buyerSignatureDataUrl: ${trade.spaDocument?.buyerSignatureDataUrl ? 'SET' : 'NOT SET'}`,
        );
      }

      const updatedTrade = await trade.save();

      // Verify the save worked by re-fetching from database
      const verifyTrade = await this.tradeModel.findById(tradeId);
      const verifyDoc = verifyTrade ? verifyTrade[fieldName] : null;
      console.log(`Trade saved. Verifying from DB...`);
      if (documentType === 'spa' && verifyDoc) {
        console.log(
          `DB SPA sellerSignatureDataUrl: ${verifyDoc?.sellerSignatureDataUrl ? 'SET' : 'NOT SET'}`,
        );
        console.log(
          `DB SPA buyerSignatureDataUrl: ${verifyDoc?.buyerSignatureDataUrl ? 'SET' : 'NOT SET'}`,
        );

        // If verify shows NOT SET but we tried to set it, there's a problem
        if (isSeller && !verifyDoc.sellerSignatureDataUrl) {
          console.error('ERROR: Seller signature was not saved to database!');
        }
        if (isBuyer && !verifyDoc.buyerSignatureDataUrl) {
          console.error('ERROR: Buyer signature was not saved to database!');
        }
      }

      // Log audit event (non-blocking)
      this.auditService
        .logSignatureAdded(tradeId, userId, documentType)
        .catch((err) => console.error('Failed to create audit log:', err));

      // Determine message based on SPA signature status
      let message = `${documentType.toUpperCase()} document signed successfully`;
      const savedDoc = updatedTrade[fieldName];
      if (documentType === 'spa' && savedDoc) {
        const bothSigned =
          savedDoc.sellerSignatureDataUrl && savedDoc.buyerSignatureDataUrl;
        message = bothSigned
          ? 'SPA fully signed by both parties - advancing to Payment phase'
          : `SPA signed by ${isSeller ? 'seller' : 'buyer'} - waiting for ${isSeller ? 'buyer' : 'seller'} signature`;
      }

      return {
        statusCode: 200,
        message,
        data: {
          trade: updatedTrade,
          document: savedDoc,
          spaStatus:
            documentType === 'spa' && savedDoc
              ? {
                  sellerSigned: !!savedDoc.sellerSignatureDataUrl,
                  buyerSigned: !!savedDoc.buyerSignatureDataUrl,
                  fullySigned: !!(
                    savedDoc.sellerSignatureDataUrl &&
                    savedDoc.buyerSignatureDataUrl
                  ),
                }
              : undefined,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to sign document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ========================
  // Helper Methods
  // ========================

  /**
   * Issue #4 - Validate negotiation state transition
   * Ensures the action is allowed from the current state by the given party
   */
  private validateNegotiationTransition(
    currentStatus: string,
    action: NegotiationAction,
    isSeller: boolean,
    isBuyer: boolean,
  ): void {
    // Check if trade is in a closed state
    if (CLOSED_NEGOTIATION_STATUSES.includes(currentStatus)) {
      throw new HttpException(
        `Cannot perform ${action} action on a ${currentStatus} trade`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Get valid transitions for current state
    const validTransitions = NEGOTIATION_TRANSITIONS[currentStatus];
    if (!validTransitions) {
      throw new HttpException(
        `Invalid negotiation status: ${currentStatus}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Find the transition for this action
    const transition = validTransitions.find((t) => t.action === action);
    if (!transition) {
      throw new HttpException(
        `Cannot ${action} from ${currentStatus} status`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if the party is allowed to perform this action
    const party: Party = isSeller ? 'seller' : isBuyer ? 'buyer' : 'both';
    const isAllowed =
      transition.allowedBy === 'both' || transition.allowedBy === party;

    if (!isAllowed) {
      const allowedPartyName =
        transition.allowedBy === 'both'
          ? 'either party'
          : `the ${transition.allowedBy}`;
      throw new HttpException(
        `Only ${allowedPartyName} can ${action} at this stage`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * Validate verification permissions based on user role
   * SCO → Buyer verifies, ICPO → Seller verifies
   * Payment Proof → Seller verifies, BoL → Buyer verifies
   */
  private validateVerificationPermissions(
    documentType: DocumentType,
    isSeller: boolean,
    isBuyer: boolean,
    status: 'approved' | 'rejected' = 'approved',
  ): void {
    switch (documentType) {
      case 'sco':
        if (!isBuyer) {
          throw new HttpException(
            'Only buyers can verify SCO',
            HttpStatus.FORBIDDEN,
          );
        }
        break;
      case 'icpo':
        if (!isSeller) {
          throw new HttpException(
            'Only sellers can verify ICPO',
            HttpStatus.FORBIDDEN,
          );
        }
        break;
      case 'spa':
        // ========================
        // PHASE 2 REFACTORING: New SPA approval flow
        // ========================
        // Seller uploads SPA → Buyer approves/rejects → Buyer uploads signed SPA
        // Buyer approves seller's SPA
        if (status === 'approved') {
          if (!isBuyer) {
            throw new HttpException(
              "Only buyers can approve seller's SPA",
              HttpStatus.FORBIDDEN,
            );
          }
        }
        // Either party can reject
        break;
      case 'signed-spa' as DocumentType:
        // ========================
        // PHASE 2 REFACTORING: Signed SPA verification
        // ========================
        // Seller verifies buyer's signed SPA
        if (!isSeller) {
          throw new HttpException(
            'Only sellers can verify signed SPA',
            HttpStatus.FORBIDDEN,
          );
        }
        break;
      case 'payment-proof':
        if (!isSeller) {
          throw new HttpException(
            'Only sellers can verify payment proof',
            HttpStatus.FORBIDDEN,
          );
        }
        break;
      case 'bol':
        if (!isBuyer) {
          throw new HttpException(
            'Only buyers can verify BoL',
            HttpStatus.FORBIDDEN,
          );
        }
        break;
    }
  }

  /**
   * SECURITY FIX: Validate document access based on trade phase (Audit Bug - Document Authorization)
   * Ensures documents can only be accessed at or after the appropriate trade phase
   * This provides defense-in-depth beyond just buyer/seller role checks
   */
  private validateDocumentAccess(
    documentType: DocumentType,
    trade: Trade,
    isSeller: boolean,
    isBuyer: boolean,
  ): void {
    // Define minimum phase required to access each document type
    const phaseOrder: Record<TradePhase, number> = {
      PR: 0,
      SCO: 1,
      ICPO: 2,
      SPA: 3,
      PAYMENT: 4,
      BOL: 5,
      COMPLETED: 6,
      CANCELLED: 7,
    };

    // Define which phase each document becomes accessible
    const documentPhaseRequirement: Record<DocumentType, TradePhase> = {
      sco: 'SCO', // SCO accessible from SCO phase onwards
      icpo: 'ICPO', // ICPO accessible from ICPO phase onwards
      spa: 'SPA', // SPA accessible from SPA phase onwards
      'signed-spa': 'SPA', // Signed SPA accessible from SPA phase onwards
      'payment-proof': 'PAYMENT', // Payment proof accessible from PAYMENT phase onwards
      bol: 'BOL', // BoL accessible from BOL phase onwards
    };

    const currentPhaseOrder = phaseOrder[trade.tradePhase] ?? 0;
    const requiredPhaseOrder =
      phaseOrder[documentPhaseRequirement[documentType]] ?? 0;

    // Allow access to documents from the phase they were created onwards
    // Also allow access in CANCELLED state for audit purposes (documents remain accessible)
    if (
      trade.tradePhase !== 'CANCELLED' &&
      currentPhaseOrder < requiredPhaseOrder
    ) {
      throw new HttpException(
        `${documentType.toUpperCase()} document is not available at this stage of the trade`,
        HttpStatus.FORBIDDEN,
      );
    }

    // Both buyer and seller can access all documents in their trade
    // This is standard B2B trade behavior - full transparency between parties
    if (!isBuyer && !isSeller) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }
  }

  /**
   * Validate signing permissions based on user role
   * SCO → Seller signs, ICPO → Buyer signs, SPA → BOTH parties must sign, BoL → Seller signs
   */
  private validateSigningPermissions(
    documentType: DocumentType,
    isSeller: boolean,
    isBuyer: boolean,
    trade: Trade,
  ): void {
    const doc = this.getExistingDocument(trade, documentType);

    // For SPA, check dual signatures separately (handled in signDocument)
    if (documentType === 'spa') {
      // Each party can only sign once - detailed check in signDocument method
      return;
    }

    // For other documents, check if already signed
    if (doc?.signatureDataUrl) {
      throw new HttpException(
        `${documentType.toUpperCase()} document is already signed`,
        HttpStatus.BAD_REQUEST,
      );
    }

    switch (documentType) {
      case 'sco':
        if (!isSeller) {
          throw new HttpException(
            'Only sellers can sign SCO',
            HttpStatus.FORBIDDEN,
          );
        }
        break;
      case 'icpo':
        if (!isBuyer) {
          throw new HttpException(
            'Only buyers can sign ICPO',
            HttpStatus.FORBIDDEN,
          );
        }
        break;
      case 'bol':
        if (!isSeller) {
          throw new HttpException(
            'Only sellers can sign BoL',
            HttpStatus.FORBIDDEN,
          );
        }
        break;
      case 'payment-proof':
        throw new HttpException(
          'Payment proof documents cannot be signed',
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  /**
   * Get existing document from trade based on document type
   */
  private getExistingDocument(
    trade: Trade,
    documentType: DocumentType,
  ): DocumentInfo | undefined {
    switch (documentType) {
      case 'sco':
        return trade.scoDocument;
      case 'icpo':
        return trade.icpoDocument;
      case 'spa':
        return trade.spaDocument;
      case 'bol':
        return trade.bolDocument;
      case 'payment-proof':
        return trade.paymentProof;
      default:
        return undefined;
    }
  }

  /**
   * Get document versions for a trade
   */
  async getDocumentVersions(
    tradeId: string,
    documentType: DocumentType,
    accountToken: string,
  ) {
    const decodedToken = this.authService.validateAccountToken(accountToken);
    const userId = (decodedToken as any).userId;

    const trade = await this.tradeModel.findById(tradeId);
    if (!trade) {
      throw new HttpException('Trade not found', HttpStatus.NOT_FOUND);
    }

    // Verify user access
    const isSeller = trade.seller.toString() === userId;
    const isBuyer = trade.buyer.toString() === userId;
    if (!isSeller && !isBuyer) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    const document = this.getExistingDocument(trade, documentType);
    if (!document) {
      return { versions: [], currentVersion: null };
    }

    const currentVersion = {
      filePath: document.filePath,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
      uploadedAt: document.uploadedAt,
      uploadedBy: document.uploadedBy,
      version: document.version || 1,
      isCurrent: true,
    };

    const history = (document.history || []).map((v) => ({
      ...v,
      isCurrent: false,
    }));

    return {
      currentVersion,
      versions: [currentVersion, ...history.reverse()],
      totalVersions: history.length + 1,
    };
  }

  /**
   * Download a specific version of a document
   */
  async downloadDocumentVersion(
    tradeId: string,
    documentType: DocumentType,
    version: number,
    accountToken: string,
  ) {
    const decodedToken = this.authService.validateAccountToken(accountToken);
    const userId = (decodedToken as any).userId;

    const trade = await this.tradeModel.findById(tradeId);
    if (!trade) {
      throw new HttpException('Trade not found', HttpStatus.NOT_FOUND);
    }

    // Verify user access
    const isSeller = trade.seller.toString() === userId;
    const isBuyer = trade.buyer.toString() === userId;
    if (!isSeller && !isBuyer) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    const document = this.getExistingDocument(trade, documentType);
    if (!document) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    const currentVersion = document.version || 1;

    // If requesting current version
    if (version === currentVersion) {
      return {
        filePath: document.filePath,
        originalName: document.originalName,
        mimeType: document.mimeType,
      };
    }

    // Find in history
    const historyVersion = (document.history || []).find(
      (v) => v.version === version,
    );
    if (!historyVersion) {
      throw new HttpException(
        `Version ${version} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      filePath: historyVersion.filePath,
      originalName: historyVersion.originalName,
      mimeType: historyVersion.mimeType,
    };
  }

  /**
   * Validate document upload permissions based on user role
   */
  private validateDocumentPermissions(
    documentType: DocumentType,
    isSeller: boolean,
    isBuyer: boolean,
    trade: Trade,
  ): void {
    // Check if negotiation is accepted first
    if (trade.negotiationStatus !== 'accepted') {
      throw new HttpException(
        'Cannot upload documents before negotiation is accepted',
        HttpStatus.BAD_REQUEST,
      );
    }

    switch (documentType) {
      case 'sco':
        if (!isSeller) {
          throw new HttpException(
            'Only sellers can upload SCO',
            HttpStatus.FORBIDDEN,
          );
        }
        break;
      case 'icpo':
        if (!isBuyer) {
          throw new HttpException(
            'Only buyers can upload ICPO',
            HttpStatus.FORBIDDEN,
          );
        }
        if (!trade.scoDocument) {
          throw new HttpException(
            'SCO must be uploaded before ICPO',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;
      case 'spa':
        // Either party can upload SPA
        if (!trade.icpoDocument) {
          throw new HttpException(
            'ICPO must be uploaded before SPA',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;
      case 'payment-proof':
        if (!isBuyer) {
          throw new HttpException(
            'Only buyers can upload payment proof',
            HttpStatus.FORBIDDEN,
          );
        }
        if (!trade.spaDocument) {
          throw new HttpException(
            'SPA must be uploaded before payment proof',
            HttpStatus.BAD_REQUEST,
          );
        }
        // ========================
        // PHASE 2 REFACTORING: New SPA flow validation
        // ========================
        // Now requires: Seller's SPA approved + Buyer's signed SPA approved
        // Check for signed SPA document (new flow)
        if (trade.signedSpaDocument) {
          // New flow: Check if signed SPA is approved
          if (trade.signedSpaDocument.status !== 'approved') {
            throw new HttpException(
              'Signed SPA must be approved before uploading payment proof',
              HttpStatus.BAD_REQUEST,
            );
          }
        } else {
          // Legacy fallback: Check dual signatures (for existing trades)
          if (
            !trade.spaDocument.sellerSignatureDataUrl ||
            !trade.spaDocument.buyerSignatureDataUrl
          ) {
            throw new HttpException(
              'SPA process must be completed before uploading payment proof. Upload your signed SPA first.',
              HttpStatus.BAD_REQUEST,
            );
          }
        }
        break;
      case 'bol':
        if (!isSeller) {
          throw new HttpException(
            'Only sellers can upload BoL',
            HttpStatus.FORBIDDEN,
          );
        }
        if (!trade.paymentProof) {
          throw new HttpException(
            'Payment proof must be uploaded before BoL',
            HttpStatus.BAD_REQUEST,
          );
        }
        // ========================
        // PHASE 2 REFACTORING: Require payment proof to be APPROVED
        // ========================
        if (trade.paymentProof.status !== 'approved') {
          throw new HttpException(
            'Payment proof must be approved by seller before uploading BoL',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;
    }
  }

  /**
   * Validate that all prior documents are approved before allowing upload
   * This prevents trade progression when a prior document has been rejected
   */
  private validatePriorDocumentsApproved(
    trade: Trade,
    documentType: DocumentType,
  ): void {
    const documentOrder: DocumentType[] = [
      'sco',
      'icpo',
      'spa',
      'payment-proof',
      'bol',
    ];
    const currentIndex = documentOrder.indexOf(documentType);

    // No prior documents to check for SCO
    if (currentIndex <= 0) return;

    const priorDocs: {
      type: DocumentType;
      doc: DocumentInfo | undefined;
      label: string;
    }[] = [
      { type: 'sco', doc: trade.scoDocument, label: 'SCO' },
      { type: 'icpo', doc: trade.icpoDocument, label: 'ICPO' },
      { type: 'spa', doc: trade.spaDocument, label: 'SPA' },
      {
        type: 'payment-proof',
        doc: trade.paymentProof,
        label: 'Payment Proof',
      },
    ];

    // Check all prior documents (up to but not including current)
    for (let i = 0; i < currentIndex && i < priorDocs.length; i++) {
      const prior = priorDocs[i];
      if (prior.doc && prior.doc.status === 'rejected') {
        throw new HttpException(
          `Cannot upload ${documentType.toUpperCase()} - ${prior.label} was rejected and needs to be re-uploaded first`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  /**
   * Check if phase should be advanced based on document upload
   */
  private shouldAdvancePhase(
    currentPhase: TradePhase,
    newPhase: TradePhase,
  ): boolean {
    // Issue #18 - Use constant instead of hardcoded array
    const currentIndex = TRADE_PHASE_ORDER.indexOf(currentPhase);
    const newIndex = TRADE_PHASE_ORDER.indexOf(newPhase);
    return newIndex > currentIndex;
  }

  /**
   * Validate if a phase transition is valid
   */
  private isValidPhaseTransition(
    currentPhase: TradePhase,
    newPhase: TradePhase,
  ): boolean {
    // Issue #18 - Use constant instead of hardcoded array
    const currentIndex = TRADE_PHASE_ORDER.indexOf(currentPhase);
    const newIndex = TRADE_PHASE_ORDER.indexOf(newPhase);

    // Can only advance to the next phase or stay at current
    return newIndex === currentIndex + 1;
  }

  /**
   * Issue #9 - Validate required documents exist for phase transition
   */
  private validatePhaseTransitionDocuments(
    trade: Trade,
    targetPhase: TradePhase,
  ): void {
    switch (targetPhase) {
      case 'SCO':
        // Moving to SCO requires negotiation to be accepted
        if (trade.negotiationStatus !== 'accepted') {
          throw new HttpException(
            'Negotiation must be accepted before advancing to SCO phase',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;
      case 'ICPO':
        // Moving to ICPO requires SCO document
        if (!trade.scoDocument?.filePath) {
          throw new HttpException(
            'SCO document must be uploaded before advancing to ICPO phase',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;
      case 'SPA':
        // Moving to SPA requires ICPO document
        if (!trade.icpoDocument?.filePath) {
          throw new HttpException(
            'ICPO document must be uploaded before advancing to SPA phase',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;
      case 'PAYMENT':
        // Moving to PAYMENT requires SPA document signed by both parties
        if (!trade.spaDocument?.filePath) {
          throw new HttpException(
            'SPA document must be uploaded before advancing to Payment phase',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (
          !trade.spaDocument?.sellerSignatureDataUrl ||
          !trade.spaDocument?.buyerSignatureDataUrl
        ) {
          throw new HttpException(
            'SPA must be signed by both parties before advancing to Payment phase',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;
      case 'BOL':
        // Moving to BOL requires payment proof
        if (!trade.paymentProof?.filePath) {
          throw new HttpException(
            'Payment proof must be uploaded before advancing to BoL phase',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;
      case 'COMPLETED':
        // Moving to COMPLETED requires BoL document
        if (!trade.bolDocument?.filePath) {
          throw new HttpException(
            'Bill of Lading must be uploaded before completing the trade',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;
    }
  }

  // ========================
  // TRADE CANCELLATION
  // ========================

  /**
   * Cancel a trade
   * Rules:
   * - PR phase (pending/countered): Free cancellation
   * - Accepted/SCO phase: Allowed with reason
   * - ICPO phase and beyond: Cannot cancel (too late in process)
   */
  async cancelTrade(tradeId: string, accountToken: string, reason?: string) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const trade = await this.tradeModel.findById(tradeId);
      if (!trade) {
        throw new HttpException('Trade not found', HttpStatus.NOT_FOUND);
      }

      // Verify user is either buyer or seller
      const isSeller = trade.seller.toString() === userId;
      const isBuyer = trade.buyer.toString() === userId;

      if (!isSeller && !isBuyer) {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      // Check if trade is already closed
      if (
        trade.negotiationStatus === 'rejected' ||
        trade.negotiationStatus === 'cancelled' ||
        trade.tradePhase === 'COMPLETED' ||
        trade.tradePhase === 'CANCELLED'
      ) {
        throw new HttpException(
          'Trade is already closed and cannot be cancelled',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check cancellation rules based on trade phase
      const cancellablePhases: string[] = ['PR', 'SCO'];
      const requiresReasonPhases: string[] = ['SCO'];

      // Trades beyond SCO phase cannot be cancelled
      if (
        !cancellablePhases.includes(trade.tradePhase) &&
        trade.negotiationStatus === 'accepted'
      ) {
        throw new HttpException(
          'Trade cannot be cancelled at this stage. Please contact support.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Require reason for SCO phase cancellations
      if (requiresReasonPhases.includes(trade.tradePhase) && !reason) {
        throw new HttpException(
          'A cancellation reason is required at this stage of the trade',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Add cancellation to history
      const historyEntry = {
        round: (trade.currentNegotiationRound || 0) + 1,
        party: isSeller ? ('seller' as const) : ('buyer' as const),
        message: `Trade cancelled${reason ? `: ${reason}` : ''}`,
        timestamp: new Date(),
      };

      // Update trade with cancellation
      trade.negotiationStatus = 'cancelled';
      trade.tradePhase = 'CANCELLED';
      trade.cancelledAt = new Date();
      trade.cancelledBy = new Types.ObjectId(userId);
      trade.cancellationReason = reason;
      trade.negotiationHistory.push(historyEntry);

      // Restore Stock on Cancellation
      await this.restoreStock(trade);

      const updatedTrade = await trade.save();

      // Log audit event (non-blocking)
      this.auditService
        .logTradeCancelled(tradeId, userId, reason)
        .catch((err) => console.error('Failed to create audit log:', err));

      // Send notification (non-blocking)
      const populatedTrade = await this.populateTradeForNotification(tradeId);

      if (populatedTrade) {
        this.notificationService
          .notifyTradeCancelled(
            populatedTrade as any,
            isSeller ? 'seller' : 'buyer',
            reason || 'Trade was cancelled',
          )
          .catch((err) =>
            console.error('Failed to send cancellation notification:', err),
          );
      }

      return {
        statusCode: 200,
        message: 'Trade cancelled successfully',
        data: updatedTrade,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to cancel trade',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Issue #5 - Restore stock when a trade is cancelled or rejected
   * Uses MongoDB's $inc operator for atomic stock restoration
   * This is simpler and more reliable than OCC for additive operations
   */

  /**
   * ========================
   * PHASE 2 REFACTORING: Auto-cancel trade
   * ========================
   * Automatically cancels a trade when document rejection limits are exceeded
   * Handles: status updates, stock restoration, dispute window setup, and notifications
   */
  private async autoCancelTrade(trade: Trade, reason: string): Promise<void> {
    const now = new Date();

    // Update trade status
    trade.negotiationStatus = 'cancelled';
    trade.tradePhase = 'CANCELLED';
    trade.autoCancelledAt = now;
    trade.autoCancellationReason = reason;
    trade.cancelledAt = now;

    // Set 30-day dispute eligibility window
    trade.disputeEligibilityEndsAt = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    // Track last phase change for admin monitoring
    trade.lastPhaseChangeAt = now;

    // Save the trade first (before stock restoration to ensure consistency)
    await trade.save();

    // Restore stock
    await this.restoreStock(trade);

    // Send notifications to both parties (non-blocking)
    const populatedTrade = await this.populateTradeForNotification(trade._id as Types.ObjectId);

    if (populatedTrade) {
      this.notificationService
        .notifyTradeAutoCancelled(populatedTrade as any, reason)
        .catch((err) =>
          console.error('Failed to send auto-cancellation notification:', err),
        );
    }

    console.log(`Trade ${trade._id} auto-cancelled: ${reason}`);
  }

  private async restoreStock(trade: Trade) {
    if (!trade.product || !trade.quantity) return;

    // SECURITY FIX: Check stockRestored flag to prevent double-restoration (Audit Bug #8)
    // This flag ensures stock is only restored once per trade, preventing exploitation
    if (trade.stockRestored) {
      console.warn(
        `Stock already restored for trade ${trade._id}, skipping restoration`,
      );
      return;
    }

    // Type guard: quantity is now a number in schema, but handle both cases for migration safety
    const tradeQty =
      typeof trade.quantity === 'number'
        ? trade.quantity
        : parseFloat(trade.quantity as any);
    if (isNaN(tradeQty) || tradeQty <= 0) {
      console.warn(
        `Invalid quantity for trade ${trade._id}: ${trade.quantity}`,
      );
      return;
    }

    try {
      // SECURITY FIX: Atomically mark stock as restored FIRST using findOneAndUpdate
      // This prevents race conditions where two concurrent requests both pass the stockRestored check
      const markResult = await this.tradeModel.findOneAndUpdate(
        {
          _id: trade._id,
          stockRestored: { $ne: true }, // Only update if NOT already restored
        },
        { $set: { stockRestored: true } },
        { new: true },
      );

      if (!markResult) {
        // Another request already marked it as restored
        console.warn(
          `Stock restoration already in progress or completed for trade ${trade._id}`,
        );
        return;
      }

      // Issue #5 - Use $inc for atomic stock restoration
      // This is more reliable than OCC because:
      // 1. $inc is natively atomic in MongoDB
      // 2. We don't need to read-then-write, eliminating race conditions
      // 3. Multiple concurrent restorations will all succeed correctly
      const result = await this.productModel.findByIdAndUpdate(
        trade.product,
        {
          $inc: {
            stock: tradeQty,
          },
        },
        { new: true },
      );

      if (!result) {
        console.warn(
          `Product ${trade.product} not found during stock restoration for trade ${trade._id}`,
        );
        // Log this for manual review - the product may have been deleted
        return;
      }

      console.log(
        `Successfully restored ${tradeQty} stock for product ${trade.product}. New stock: ${result.stock}`,
      );
    } catch (error) {
      // If $inc fails (e.g., because stock is not a numeric string), fall back to OCC approach
      if (error.message?.includes('Cannot apply $inc')) {
        console.log(
          '$inc failed, falling back to OCC approach for stock restoration',
        );
        await this.restoreStockWithOCC(trade, tradeQty);
      } else {
        console.error(`Failed to restore stock for trade ${trade._id}:`, error);
        throw error; // Propagate unexpected errors
      }
    }
  }

  /**
   * Issue #5 - Fallback stock restoration using OCC for non-numeric stock values
   */
  private async restoreStockWithOCC(trade: Trade, tradeQty: number) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        attempt++;

        const product = await this.productModel.findById(trade.product);
        if (!product) {
          console.warn(
            `Product ${trade.product} not found during OCC stock restoration`,
          );
          return;
        }

        const currentStock =
          typeof product.stock === 'number'
            ? product.stock
            : parseFloat(String(product.stock ?? '0'));
        if (isNaN(currentStock)) {
          console.warn(
            `Invalid stock format for product ${product._id}: ${product.stock}`,
          );
          return;
        }

        const newStock = (currentStock + tradeQty).toString();

        // Atomic update with OCC condition
        const updatedProduct = await this.productModel.findOneAndUpdate(
          { _id: product._id, stock: product.stock },
          { stock: newStock },
          { new: true },
        );

        if (updatedProduct) {
          console.log(
            `Successfully restored ${tradeQty} stock via OCC for product ${product._id}`,
          );
          return;
        }

        console.log(
          `OCC conflict (Attempt ${attempt}/${maxRetries}). Retrying...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      } catch (error) {
        console.error(
          `OCC stock restoration error (Attempt ${attempt}/${maxRetries}):`,
          error,
        );
      }
    }

    console.error(
      `Failed to restore stock for trade ${trade._id} after ${maxRetries} OCC attempts`,
    );
  }

  // ========================
  // UNREAD COUNTS & BADGE METHODS
  // ========================

  /**
   * Get unread counts for trade tabs
   * Returns counts for PR, PO, SPA, and Ongoing tabs
   */
  async getUnreadCounts(accountToken: string) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const userObjectId = new Types.ObjectId(userId);

      // Calculate date threshold for cancelled trade visibility (2 days ago)
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      // Issue #12 - Fixed aggregation to properly categorize trades including history tab
      // Issue #13 - Fixed: Align unread counts with frontend display filtering
      // - Exclude cancelled trades older than 2 days (matches frontend shouldShowCancelledTrade)
      // - Route CANCELLED tradePhase to history
      // - Exclude purchaseRequestStatus === 'rejected' from PR tab

      // Get counts for buyer role
      const buyerCounts = await this.tradeModel.aggregate([
        {
          $match: {
            buyer: userObjectId,
            buyerHasUnread: true,
            // Exclude cancelled trades older than 2 days (aligns with frontend visibility)
            $or: [
              {
                negotiationStatus: { $ne: 'cancelled' },
                tradePhase: { $ne: 'CANCELLED' },
              },
              { cancelledAt: { $gte: twoDaysAgo } },
              { autoCancelledAt: { $gte: twoDaysAgo } },
              {
                cancelledAt: { $exists: false },
                autoCancelledAt: { $exists: false },
              },
            ],
          },
        },
        {
          $group: {
            _id: {
              $cond: [
                // Completed/rejected/cancelled trades go to history
                {
                  $in: [
                    '$negotiationStatus',
                    ['completed', 'rejected', 'cancelled'],
                  ],
                },
                'history',
                {
                  $cond: [
                    // Trades in COMPLETED or CANCELLED phase go to history
                    { $in: ['$tradePhase', ['COMPLETED', 'CANCELLED']] },
                    'history',
                    {
                      $cond: [
                        // PR tab: pending negotiations (excluding rejected purchaseRequestStatus)
                        {
                          $and: [
                            {
                              $in: [
                                '$negotiationStatus',
                                ['pending', 'countered', 'buyer_responded'],
                              ],
                            },
                            { $ne: ['$purchaseRequestStatus', 'rejected'] },
                          ],
                        },
                        'pr',
                        {
                          $cond: [
                            { $eq: ['$negotiationStatus', 'accepted'] },
                            {
                              $cond: [
                                // PO tab: PR (after acceptance, waiting for SCO), SCO, ICPO phases
                                { $in: ['$tradePhase', ['PR', 'SCO', 'ICPO']] },
                                'po',
                                {
                                  $cond: [
                                    // SPA tab: SPA phase
                                    { $eq: ['$tradePhase', 'SPA'] },
                                    'spa',
                                    {
                                      $cond: [
                                        // Ongoing: ONLY PAYMENT and BOL phases
                                        {
                                          $in: [
                                            '$tradePhase',
                                            ['PAYMENT', 'BOL'],
                                          ],
                                        },
                                        'ongoing',
                                        // Any other accepted trade goes to history
                                        'history',
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            'history', // Fallback for any other status
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            count: { $sum: 1 },
          },
        },
      ]);

      // Get counts for seller role
      const sellerCounts = await this.tradeModel.aggregate([
        {
          $match: {
            seller: userObjectId,
            sellerHasUnread: true,
            // Exclude cancelled trades older than 2 days (aligns with frontend visibility)
            $or: [
              {
                negotiationStatus: { $ne: 'cancelled' },
                tradePhase: { $ne: 'CANCELLED' },
              },
              { cancelledAt: { $gte: twoDaysAgo } },
              { autoCancelledAt: { $gte: twoDaysAgo } },
              {
                cancelledAt: { $exists: false },
                autoCancelledAt: { $exists: false },
              },
            ],
          },
        },
        {
          $group: {
            _id: {
              $cond: [
                // Completed/rejected/cancelled trades go to history
                {
                  $in: [
                    '$negotiationStatus',
                    ['completed', 'rejected', 'cancelled'],
                  ],
                },
                'history',
                {
                  $cond: [
                    // Trades in COMPLETED or CANCELLED phase go to history
                    { $in: ['$tradePhase', ['COMPLETED', 'CANCELLED']] },
                    'history',
                    {
                      $cond: [
                        // PR tab: pending negotiations (excluding rejected purchaseRequestStatus)
                        {
                          $and: [
                            {
                              $in: [
                                '$negotiationStatus',
                                ['pending', 'countered', 'buyer_responded'],
                              ],
                            },
                            { $ne: ['$purchaseRequestStatus', 'rejected'] },
                          ],
                        },
                        'pr',
                        {
                          $cond: [
                            { $eq: ['$negotiationStatus', 'accepted'] },
                            {
                              $cond: [
                                // PO tab: PR (after acceptance, waiting for SCO), SCO, ICPO phases
                                { $in: ['$tradePhase', ['PR', 'SCO', 'ICPO']] },
                                'po',
                                {
                                  $cond: [
                                    // SPA tab: SPA phase
                                    { $eq: ['$tradePhase', 'SPA'] },
                                    'spa',
                                    {
                                      $cond: [
                                        // Ongoing: ONLY PAYMENT and BOL phases
                                        {
                                          $in: [
                                            '$tradePhase',
                                            ['PAYMENT', 'BOL'],
                                          ],
                                        },
                                        'ongoing',
                                        // Any other accepted trade goes to history
                                        'history',
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            'history', // Fallback for any other status
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            count: { $sum: 1 },
          },
        },
      ]);

      // Combine counts - including history tab
      const counts = {
        pr: 0,
        po: 0,
        spa: 0,
        ongoing: 0,
        history: 0,
      };

      [...buyerCounts, ...sellerCounts].forEach((item) => {
        if (item._id && counts.hasOwnProperty(item._id)) {
          counts[item._id] += item.count;
        }
      });

      return {
        statusCode: 200,
        message: 'Unread counts retrieved successfully',
        data: counts,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get unread counts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Mark trades as read for a specific tab type
   */
  async markTradesAsRead(
    accountToken: string,
    tabType: 'pr' | 'po' | 'spa' | 'ongoing' | 'history',
  ) {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const userObjectId = new Types.ObjectId(userId);
      const now = new Date();

      // Build query based on tab type
      // Issue #13 - Aligned with getUnreadCounts categorization logic
      let statusFilter: any = {};
      switch (tabType) {
        case 'pr':
          // PR tab: pending negotiations, excluding rejected purchaseRequestStatus and CANCELLED phase
          statusFilter = {
            negotiationStatus: {
              $in: ['pending', 'countered', 'buyer_responded'],
            },
            purchaseRequestStatus: { $ne: 'rejected' },
            tradePhase: { $ne: 'CANCELLED' },
          };
          break;
        case 'po':
          // PO tab includes PR phase after acceptance (waiting for SCO), SCO, and ICPO phases
          statusFilter = {
            negotiationStatus: 'accepted',
            tradePhase: { $in: ['PR', 'SCO', 'ICPO'] },
          };
          break;
        case 'spa':
          statusFilter = {
            negotiationStatus: 'accepted',
            tradePhase: 'SPA',
          };
          break;
        case 'ongoing':
          statusFilter = {
            negotiationStatus: 'accepted',
            tradePhase: { $in: ['PAYMENT', 'BOL'] },
          };
          break;
        case 'history':
          // Trade history includes completed, rejected, cancelled, and CANCELLED phase trades
          statusFilter = {
            $or: [
              { tradePhase: { $in: ['COMPLETED', 'CANCELLED'] } },
              {
                negotiationStatus: {
                  $in: ['rejected', 'completed', 'cancelled'],
                },
              },
            ],
          };
          break;
      }

      // Mark as read for buyer
      await this.tradeModel.updateMany(
        {
          buyer: userObjectId,
          buyerHasUnread: true,
          ...statusFilter,
        },
        {
          $set: {
            buyerHasUnread: false,
            lastBuyerViewedAt: now,
          },
        },
      );

      // Mark as read for seller
      await this.tradeModel.updateMany(
        {
          seller: userObjectId,
          sellerHasUnread: true,
          ...statusFilter,
        },
        {
          $set: {
            sellerHasUnread: false,
            lastSellerViewedAt: now,
          },
        },
      );

      return {
        statusCode: 200,
        message: 'Trades marked as read',
        data: { tabType, markedAt: now },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to mark trades as read',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Helper method to set unread flag for the other party
   * Called after trade events to notify the other party
   */
  async setUnreadForOtherParty(tradeId: string, actingUserId: string) {
    try {
      const trade = await this.tradeModel.findById(tradeId);
      if (!trade) return;

      const isBuyer = trade.buyer.toString() === actingUserId;

      if (isBuyer) {
        // Buyer acted, mark as unread for seller
        await this.tradeModel.updateOne(
          { _id: tradeId },
          { $set: { sellerHasUnread: true } },
        );
      } else {
        // Seller acted, mark as unread for buyer
        await this.tradeModel.updateOne(
          { _id: tradeId },
          { $set: { buyerHasUnread: true } },
        );
      }
    } catch (error) {
      console.error('Failed to set unread flag:', error);
    }
  }

  // ========================
  // PAGINATION METHODS
  // ========================

  /**
   * Get paginated trades for buyer
   */
  async getUserTradesPaginated(
    accountToken: string,
    options: TradePaginationDto,
  ): Promise<TradePaginationResult<Trade>> {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const { page = 1, limit = 10, status, phase, search } = options;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = { buyer: new Types.ObjectId(userId) };

      if (status) {
        query.negotiationStatus = status;
      }

      if (phase) {
        query.tradePhase = phase;
      }

      // Get total count
      const total = await this.tradeModel.countDocuments(query);

      // Get paginated trades
      const trades = await this.tradeModel
        .find(query)
        .populate('product', 'name price currency productImages testReports')
        .populate('seller', 'mail')
        .populate('buyer', 'mail')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(total / limit);

      return {
        trades,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve paginated trades',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get paginated trades for seller
   */
  async getSellerTradesPaginated(
    accountToken: string,
    options: TradePaginationDto,
  ): Promise<TradePaginationResult<Trade>> {
    try {
      const decodedToken = this.authService.validateAccountToken(accountToken);
      const userId = (decodedToken as any).userId;

      if (!userId) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const { page = 1, limit = 10, status, phase, search } = options;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = { seller: new Types.ObjectId(userId) };

      if (status) {
        query.negotiationStatus = status;
      }

      if (phase) {
        query.tradePhase = phase;
      }

      // Get total count
      const total = await this.tradeModel.countDocuments(query);

      // Get paginated trades
      const trades = await this.tradeModel
        .find(query)
        .populate('product', 'name price currency productImages testReports')
        .populate('seller', 'mail')
        .populate('buyer', 'mail')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(total / limit);

      return {
        trades,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve paginated trades',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
