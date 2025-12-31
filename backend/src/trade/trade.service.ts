import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Trade, TradePhase, DocumentInfo, DocumentVersion } from './schema/trade.schema';
import { CreateTradeDto } from './dto/create-trade.dto';
import { DocumentType } from './dto/upload-document.dto';
import { TradePaginationDto, TradePaginationResult } from './dto/trade-pagination.dto';
import { AuthService } from '../auth/auth.service';
import { Product } from '../products/schema/products.schema';
import { StorageService } from '../common/storage';
import { TradeNotificationService } from './trade-notification.service';
import { AuditService } from './audit.service';

@Injectable()
export class TradeService {
    constructor(
        @InjectModel(Trade.name) private readonly tradeModel: Model<Trade>,
        @InjectModel(Product.name) private readonly productModel: Model<Product>,
        private readonly authService: AuthService,
        private readonly storageService: StorageService,
        private readonly notificationService: TradeNotificationService,
        private readonly auditService: AuditService,
    ) { }

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

            // ==========================================
            // STOCK RESERVATION LOGIC (Feature E.11)
            // ==========================================
            const currentStock = parseFloat(product.stock);
            const requestedQty = parseFloat(createTradeDto.quantity);

            if (isNaN(currentStock)) {
                // If stock is not a valid number, we proceed with caution or block?
                // Assuming schema enforces valid string representation of number, but if not:
                console.warn(`Product ${product._id} has invalid stock format: ${product.stock}`);
            }

            if (!isNaN(currentStock) && !isNaN(requestedQty)) {
                if (requestedQty > currentStock) {
                    throw new HttpException(`Insufficient stock. Only ${currentStock} ${product.stockUnit || ''} available.`, HttpStatus.BAD_REQUEST);
                }

                // Optimistic Concurrency Control (OCC)
                // Attempt to update stock only if it matches what we just read
                const newStock = (currentStock - requestedQty).toString();

                const updatedProduct = await this.productModel.findOneAndUpdate(
                    {
                        _id: product._id,
                        stock: product.stock // OCC: Ensure we are updating the version we read
                    },
                    { stock: newStock },
                    { new: true }
                );

                if (!updatedProduct) {
                    // Update failed implies stock changed between read and write
                    throw new HttpException(
                        'Stock was updated by another user. Please try again.',
                        HttpStatus.CONFLICT
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
                tradeStatus: 'pending'
            });

            try {
                const savedTrade = await trade.save();

                // Log audit event (non-blocking)
                this.auditService.logTradeCreated(
                    (savedTrade._id as any).toString(),
                    buyerId,
                    {
                        productId: createTradeDto.productId,
                        quantity: createTradeDto.quantity,
                        offeredPrice: createTradeDto.buyerOfferedPrice,
                        paymentMethod: createTradeDto.paymentMethod
                    }
                ).catch(err => console.error('Failed to create audit log:', err));

                // Send notification (non-blocking)
                const populatedTrade = await this.tradeModel.findById(savedTrade._id)
                    .populate('product', '_id name price currency')
                    .populate('buyer', '_id mail notificationPreferences')
                    .populate('seller', '_id mail notificationPreferences');

                if (populatedTrade) {
                    this.notificationService.notifyTradeCreated(populatedTrade as any)
                        .catch(err => console.error('Failed to send trade created notification:', err));
                }

                return {
                    statusCode: 201,
                    message: 'Trade request created successfully',
                    data: savedTrade
                };
            } catch (saveError) {
                // ROLLBACK STOCK if trade creation fails
                // We need to restore the stock we just deducted
                if (!isNaN(currentStock) && !isNaN(requestedQty)) {
                    // We must fetch latest product to safely restore (simple increment) - avoiding full OCC loop for rollback for now
                    const latestProduct = await this.productModel.findById(product._id);
                    if (latestProduct) {
                        const stockToRestore = parseFloat(latestProduct.stock);
                        if (!isNaN(stockToRestore)) {
                            await this.productModel.findByIdAndUpdate(product._id, {
                                stock: (stockToRestore + requestedQty).toString()
                            });
                        }
                    }
                }
                throw saveError;
            }

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

    async submitCounterOffer(tradeId: string, accountToken: string, counterOfferData: {
        offeredPrice?: string;
        offeredIncoterms?: any;
        message?: string;
    }) {
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
            if (trade.seller.toString() !== userId) {
                throw new HttpException('Only the seller can submit counter-offers', HttpStatus.FORBIDDEN);
            }

            // Check if trade is in a state that allows counter-offers
            if (trade.negotiationStatus === 'accepted' || trade.negotiationStatus === 'rejected') {
                throw new HttpException('Cannot submit counter-offer on a closed trade', HttpStatus.BAD_REQUEST);
            }

            // Update trade with seller's counter-offer
            const newRound = (trade.currentNegotiationRound || 0) + 1;
            const historyEntry = {
                round: newRound,
                party: 'seller' as const,
                offeredPrice: counterOfferData.offeredPrice,
                offeredIncoterms: counterOfferData.offeredIncoterms,
                message: counterOfferData.message,
                timestamp: new Date()
            };

            trade.sellerOfferedPrice = counterOfferData.offeredPrice;
            trade.sellerOfferedIncoterms = counterOfferData.offeredIncoterms;
            trade.sellerMessage = counterOfferData.message;
            trade.negotiationStatus = 'countered';
            trade.currentNegotiationRound = newRound;
            trade.negotiationHistory.push(historyEntry);

            const updatedTrade = await trade.save();

            // Log audit event (non-blocking)
            const previousOffer = {
                buyerPrice: trade.buyerOfferedPrice,
                buyerIncoterms: trade.buyerIncoterms
            };
            this.auditService.logCounterOffer(
                tradeId,
                userId,
                previousOffer,
                {
                    offeredPrice: counterOfferData.offeredPrice,
                    offeredIncoterms: counterOfferData.offeredIncoterms,
                    message: counterOfferData.message,
                    round: historyEntry.round
                }
            ).catch(err => console.error('Failed to create audit log:', err));

            // Send notification (non-blocking)
            const populatedTrade = await this.tradeModel.findById(tradeId)
                .populate('product', '_id name price currency')
                .populate('buyer', '_id mail notificationPreferences')
                .populate('seller', '_id mail notificationPreferences');

            if (populatedTrade && counterOfferData.offeredPrice) {
                this.notificationService.notifyCounterOffer(
                    populatedTrade as any,
                    'seller',
                    counterOfferData.offeredPrice
                ).catch(err => console.error('Failed to send counter offer notification:', err));
            }

            return {
                statusCode: 200,
                message: 'Counter-offer submitted successfully',
                data: updatedTrade
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to submit counter-offer', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async buyerRespond(tradeId: string, accountToken: string, responseData: {
        offeredPrice?: string;
        offeredIncoterms?: any;
        message?: string;
    }) {
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
            if (trade.buyer.toString() !== userId) {
                throw new HttpException('Only the buyer can respond to counter-offers', HttpStatus.FORBIDDEN);
            }

            // Check if trade is in a state that allows responses
            if (trade.negotiationStatus !== 'countered') {
                throw new HttpException('Cannot respond - no counter-offer to respond to', HttpStatus.BAD_REQUEST);
            }

            const newRound = (trade.currentNegotiationRound || 0) + 1;
            const historyEntry = {
                round: newRound,
                party: 'buyer' as const,
                offeredPrice: responseData.offeredPrice,
                offeredIncoterms: responseData.offeredIncoterms,
                message: responseData.message,
                timestamp: new Date()
            };

            // Store previous state for audit
            const previousOffer = {
                sellerPrice: trade.sellerOfferedPrice,
                sellerIncoterms: trade.sellerOfferedIncoterms
            };

            trade.buyerOfferedPrice = responseData.offeredPrice;
            trade.buyerIncoterms = responseData.offeredIncoterms;
            trade.buyerMessage = responseData.message;
            trade.negotiationStatus = 'buyer_responded';
            trade.currentNegotiationRound = newRound;
            trade.negotiationHistory.push(historyEntry);

            const updatedTrade = await trade.save();

            // Log audit event (non-blocking)
            this.auditService.logBuyerResponse(
                tradeId,
                userId,
                previousOffer,
                {
                    offeredPrice: responseData.offeredPrice,
                    offeredIncoterms: responseData.offeredIncoterms,
                    message: responseData.message,
                    round: historyEntry.round
                }
            ).catch(err => console.error('Failed to create audit log:', err));

            // Send notification (non-blocking)
            const populatedTrade = await this.tradeModel.findById(tradeId)
                .populate('product', '_id name price currency')
                .populate('buyer', '_id mail notificationPreferences')
                .populate('seller', '_id mail notificationPreferences');

            if (populatedTrade && responseData.offeredPrice) {
                this.notificationService.notifyCounterOffer(
                    populatedTrade as any,
                    'buyer',
                    responseData.offeredPrice
                ).catch(err => console.error('Failed to send buyer response notification:', err));
            }

            return {
                statusCode: 200,
                message: 'Response submitted successfully',
                data: updatedTrade
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to submit response', HttpStatus.INTERNAL_SERVER_ERROR);
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

            // Check if trade can be accepted
            if (trade.negotiationStatus === 'accepted' || trade.negotiationStatus === 'rejected') {
                throw new HttpException('Trade is already closed', HttpStatus.BAD_REQUEST);
            }

            // Add acceptance to history
            const historyEntry = {
                round: (trade.currentNegotiationRound || 0) + 1,
                party: isSeller ? 'seller' as const : 'buyer' as const,
                message: 'Accepted the trade terms',
                timestamp: new Date()
            };

            trade.negotiationStatus = 'accepted';
            trade.purchaseRequestStatus = 'accepted';
            trade.acceptedAt = new Date();
            trade.negotiationHistory.push(historyEntry);

            const updatedTrade = await trade.save();

            // Log audit event (non-blocking)
            this.auditService.logTradeAccepted(
                tradeId,
                userId,
                {
                    finalPrice: trade.sellerOfferedPrice || trade.buyerOfferedPrice,
                    acceptedBy: isSeller ? 'seller' : 'buyer',
                    acceptedAt: trade.acceptedAt
                }
            ).catch(err => console.error('Failed to create audit log:', err));

            // Send notification (non-blocking)
            const populatedTrade = await this.tradeModel.findById(tradeId)
                .populate('product', '_id name price currency')
                .populate('buyer', '_id mail notificationPreferences')
                .populate('seller', '_id mail notificationPreferences');

            if (populatedTrade) {
                this.notificationService.notifyTradeAccepted(
                    populatedTrade as any,
                    isSeller ? 'seller' : 'buyer'
                ).catch(err => console.error('Failed to send trade accepted notification:', err));
            }

            return {
                statusCode: 200,
                message: 'Trade accepted successfully',
                data: updatedTrade
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to accept trade', HttpStatus.INTERNAL_SERVER_ERROR);
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

            // Check if trade can be rejected
            if (trade.negotiationStatus === 'accepted' || trade.negotiationStatus === 'rejected') {
                throw new HttpException('Trade is already closed', HttpStatus.BAD_REQUEST);
            }

            // Add rejection to history
            const historyEntry = {
                round: (trade.currentNegotiationRound || 0) + 1,
                party: isSeller ? 'seller' as const : 'buyer' as const,
                message: reason || 'Rejected the trade',
                timestamp: new Date()
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
            this.auditService.logTradeRejected(
                tradeId,
                userId,
                reason
            ).catch(err => console.error('Failed to create audit log:', err));

            // Send notification (non-blocking)
            const populatedTrade = await this.tradeModel.findById(tradeId)
                .populate('product', '_id name price currency')
                .populate('buyer', '_id mail notificationPreferences')
                .populate('seller', '_id mail notificationPreferences');

            if (populatedTrade) {
                this.notificationService.notifyTradeRejected(
                    populatedTrade as any,
                    isSeller ? 'seller' : 'buyer',
                    reason
                ).catch(err => console.error('Failed to send trade rejected notification:', err));
            }

            return {
                statusCode: 200,
                message: 'Trade rejected',
                data: updatedTrade
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to reject trade', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getNegotiationHistory(tradeId: string, accountToken: string) {
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
                    { seller: new Types.ObjectId(userId) }
                ]
            })
                .populate('buyer', 'mail')
                .populate('seller', 'mail');

            if (!trade) {
                throw new HttpException('Trade not found or access denied', HttpStatus.NOT_FOUND);
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
                        message: trade.buyerMessage
                    },
                    sellerCurrentOffer: {
                        price: trade.sellerOfferedPrice,
                        incoterms: trade.sellerOfferedIncoterms,
                        message: trade.sellerMessage
                    }
                }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to retrieve negotiation history', HttpStatus.INTERNAL_SERVER_ERROR);
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
        metadata: any
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
            const isSeller = trade.seller.toString() === userId;
            const isBuyer = trade.buyer.toString() === userId;

            if (!isSeller && !isBuyer) {
                throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
            }

            // Validate permissions based on document type
            this.validateDocumentPermissions(documentType, isSeller, isBuyer, trade);

            // Upload file to storage
            const folder = `trade-documents/${tradeId}/${documentType}`;
            const filePath = await this.storageService.upload(file.buffer, file.originalname, folder);

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
                    version: currentVersion
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
                history: history
            };

            // Update trade with document and advance phase
            const updateData: any = {};
            let newPhase: TradePhase | null = null;
            let invalidatedDocuments: string[] = [];

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
                    newPhase = 'BOL';  // Advance to BOL phase so seller can upload Bill of Lading
                    break;
            }

            // Update trade phase if appropriate (only if not already set by invalidation logic)
            if (newPhase && !updateData.tradePhase && this.shouldAdvancePhase(trade.tradePhase, newPhase)) {
                updateData.tradePhase = newPhase;
            }

            const updatedTrade = await this.tradeModel.findByIdAndUpdate(
                tradeId,
                { $set: updateData },
                { new: true }
            );

            // Log audit event (non-blocking)
            this.auditService.logDocumentUploaded(
                tradeId,
                userId,
                documentType,
                {
                    filePath: documentInfo.filePath,
                    originalName: documentInfo.originalName,
                    mimeType: documentInfo.mimeType,
                    size: documentInfo.size,
                    uploadedBy: isSeller ? 'seller' : 'buyer',
                    newPhase,
                    isReplacement: newVersion > 1,
                    invalidatedDocuments: invalidatedDocuments.length > 0 ? invalidatedDocuments : undefined
                }
            ).catch(err => console.error('Failed to create audit log:', err));

            // Send notification (non-blocking)
            const populatedTrade = await this.tradeModel.findById(tradeId)
                .populate('product', '_id name price currency')
                .populate('buyer', '_id mail notificationPreferences')
                .populate('seller', '_id mail notificationPreferences');

            if (populatedTrade) {
                // Notify about the document upload
                this.notificationService.notifyDocumentUploaded(
                    populatedTrade as any,
                    documentType.toUpperCase(),
                    isSeller ? 'seller' : 'buyer'
                ).catch(err => console.error('Failed to send document uploaded notification:', err));

                // If documents were invalidated, send additional notification to the affected party
                if (invalidatedDocuments.length > 0) {
                    this.notificationService.notifyDocumentsInvalidated(
                        populatedTrade as any,
                        documentType.toUpperCase(),
                        invalidatedDocuments
                    ).catch(err => console.error('Failed to send documents invalidated notification:', err));
                }
            }

            // Build response message
            let responseMessage = `${documentType.toUpperCase()} document uploaded successfully`;
            if (invalidatedDocuments.length > 0) {
                responseMessage += `. The following documents have been invalidated and need to be re-submitted: ${invalidatedDocuments.join(', ')}`;
            }

            return {
                statusCode: 200,
                message: responseMessage,
                data: {
                    trade: updatedTrade,
                    document: documentInfo,
                    invalidatedDocuments: invalidatedDocuments.length > 0 ? invalidatedDocuments : undefined
                }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to upload document', HttpStatus.INTERNAL_SERVER_ERROR);
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
                    { seller: new Types.ObjectId(userId) }
                ]
            });

            if (!trade) {
                throw new HttpException('Trade not found or access denied', HttpStatus.NOT_FOUND);
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
                        bol: trade.bolDocument || null,
                        paymentProof: trade.paymentProof || null
                    },
                    timestamps: {
                        scoSubmittedAt: trade.scoSubmittedAt,
                        icpoSubmittedAt: trade.icpoSubmittedAt,
                        spaUploadedAt: trade.spaUploadedAt,
                        spaSellerSignedAt: trade.spaSellerSignedAt,
                        spaBuyerSignedAt: trade.spaBuyerSignedAt,
                        paymentVerifiedAt: trade.paymentVerifiedAt,
                        bolUploadedAt: trade.bolUploadedAt,
                        completedAt: trade.completedAt
                    },
                    // SPA signature status for frontend
                    spaStatus: trade.spaDocument ? {
                        uploaded: !!trade.spaDocument.filePath,
                        sellerSigned: !!(trade.spaDocument as any).sellerSignatureDataUrl,
                        buyerSigned: !!(trade.spaDocument as any).buyerSignatureDataUrl,
                        fullySigned: !!(trade.spaDocument as any).sellerSignatureDataUrl && !!(trade.spaDocument as any).buyerSignatureDataUrl
                    } : null
                }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to retrieve trade documents', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get document for download - streams the file
     */
    async getDocumentForDownload(
        tradeId: string,
        accountToken: string,
        documentType: 'sco' | 'icpo' | 'spa' | 'bol' | 'payment-proof'
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
                    { seller: new Types.ObjectId(userId) }
                ]
            });

            if (!trade) {
                throw new HttpException('Trade not found or access denied', HttpStatus.NOT_FOUND);
            }

            // Map document type to schema field
            const documentFieldMap: Record<string, keyof Trade> = {
                'sco': 'scoDocument',
                'icpo': 'icpoDocument',
                'spa': 'spaDocument',
                'bol': 'bolDocument',
                'payment-proof': 'paymentProof'
            };

            const documentField = documentFieldMap[documentType];
            const document = trade[documentField] as DocumentInfo | undefined;

            if (!document || !document.filePath) {
                throw new HttpException(
                    `No ${documentType.toUpperCase()} document found for this trade`,
                    HttpStatus.NOT_FOUND
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
                    mimeType: document.mimeType || 'application/octet-stream'
                }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to download document', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Advance trade to a specific phase
     */
    async advanceTradePhase(tradeId: string, accountToken: string, newPhase: TradePhase) {
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
                    { seller: new Types.ObjectId(userId) }
                ]
            });

            if (!trade) {
                throw new HttpException('Trade not found or access denied', HttpStatus.NOT_FOUND);
            }

            // Validate phase transition
            if (!this.isValidPhaseTransition(trade.tradePhase, newPhase)) {
                throw new HttpException(
                    `Invalid phase transition from ${trade.tradePhase} to ${newPhase}`,
                    HttpStatus.BAD_REQUEST
                );
            }

            const previousPhase = trade.tradePhase;
            trade.tradePhase = newPhase;
            const updatedTrade = await trade.save();

            // Log audit event (non-blocking)
            this.auditService.logPhaseAdvanced(
                tradeId,
                userId,
                previousPhase,
                newPhase
            ).catch(err => console.error('Failed to create audit log:', err));

            // Send notification (non-blocking)
            const populatedTrade = await this.tradeModel.findById(tradeId)
                .populate('product', '_id name price currency')
                .populate('buyer', '_id mail notificationPreferences')
                .populate('seller', '_id mail notificationPreferences');

            if (populatedTrade) {
                this.notificationService.notifyPhaseAdvanced(
                    populatedTrade as any,
                    newPhase
                ).catch(err => console.error('Failed to send phase advanced notification:', err));
            }

            return {
                statusCode: 200,
                message: `Trade phase advanced to ${newPhase}`,
                data: updatedTrade
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to advance trade phase', HttpStatus.INTERNAL_SERVER_ERROR);
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
                    { seller: new Types.ObjectId(userId) }
                ]
            });

            if (!trade) {
                throw new HttpException('Trade not found or access denied', HttpStatus.NOT_FOUND);
            }

            // Only buyers can complete the trade (they verify receipt of goods)
            const isBuyer = trade.buyer.toString() === userId;
            if (!isBuyer) {
                throw new HttpException(
                    'Only the buyer can complete the trade after verifying receipt of goods',
                    HttpStatus.FORBIDDEN
                );
            }

            // Verify trade can be completed (must be in BOL phase with all documents)
            if (trade.tradePhase !== 'BOL') {
                throw new HttpException(
                    'Trade must be in BOL phase to be completed',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Verify BoL document exists
            if (!trade.bolDocument) {
                throw new HttpException(
                    'Bill of Lading must be uploaded before completing the trade',
                    HttpStatus.BAD_REQUEST
                );
            }

            trade.tradePhase = 'COMPLETED';
            trade.completedAt = new Date();
            trade.purchaseOrderStatus = 'completed';

            const updatedTrade = await trade.save();

            // Log audit event (non-blocking)
            const totalAmount = trade.sellerOfferedPrice ||
                trade.buyerOfferedPrice || '0';

            this.auditService.logTradeCompleted(
                tradeId,
                userId,
                {
                    completedAt: trade.completedAt,
                    totalAmount,
                    finalPhase: 'COMPLETED'
                }
            ).catch(err => console.error('Failed to create audit log:', err));

            // Send notification (non-blocking)
            const populatedTrade = await this.tradeModel.findById(tradeId)
                .populate('product', '_id name price currency')
                .populate('buyer', '_id mail notificationPreferences')
                .populate('seller', '_id mail notificationPreferences');

            if (populatedTrade) {
                // Calculate total amount from negotiated price or buyer offered price
                const notifyAmount = populatedTrade.sellerOfferedPrice ||
                    populatedTrade.buyerOfferedPrice ||
                    (populatedTrade.product as any)?.price || '0';

                this.notificationService.notifyTradeCompleted(
                    populatedTrade as any,
                    notifyAmount
                ).catch(err => console.error('Failed to send trade completed notification:', err));
            }

            return {
                statusCode: 200,
                message: 'Trade completed successfully',
                data: updatedTrade
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to complete trade', HttpStatus.INTERNAL_SERVER_ERROR);
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
        notes?: string
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
            // SCO → Buyer verifies, ICPO → Seller verifies, SPA → Either party
            // Payment Proof → Seller verifies, BoL → Buyer verifies
            this.validateVerificationPermissions(documentType, isSeller, isBuyer);

            // Get the document field name
            const documentFieldMap: Record<DocumentType, keyof Trade> = {
                'sco': 'scoDocument',
                'icpo': 'icpoDocument',
                'spa': 'spaDocument',
                'bol': 'bolDocument',
                'payment-proof': 'paymentProof'
            };

            const fieldName = documentFieldMap[documentType];
            const document = trade[fieldName] as DocumentInfo | undefined;

            if (!document) {
                throw new HttpException(
                    `${documentType.toUpperCase()} document not found`,
                    HttpStatus.NOT_FOUND
                );
            }

            // Update the document status
            (document as DocumentInfo).status = status;
            if (notes) {
                (document as DocumentInfo).notes = notes;
            }

            // If document is approved, advance to the next phase
            let phaseAdvanced = false;
            if (status === 'approved') {
                const phaseAdvanceMap: Record<string, TradePhase> = {
                    'icpo': 'SPA',      // ICPO approved → SPA phase (ready for SPA upload)
                    'spa': 'PAYMENT',   // SPA approved → Payment phase
                    'payment-proof': 'BOL', // Payment approved → BoL phase
                };

                const nextPhase = phaseAdvanceMap[documentType];
                if (nextPhase && this.shouldAdvancePhase(trade.tradePhase, nextPhase)) {
                    trade.tradePhase = nextPhase;
                    phaseAdvanced = true;
                }
            }

            // Save the updated trade
            const updatedTrade = await trade.save();

            // Log audit event (non-blocking)
            this.auditService.logDocumentVerified(
                tradeId,
                userId,
                documentType,
                status,
                notes
            ).catch(err => console.error('Failed to create audit log:', err));

            // If phase was advanced, send notification
            if (phaseAdvanced) {
                const populatedTrade = await this.tradeModel.findById(tradeId)
                    .populate('product', '_id name price currency')
                    .populate('buyer', '_id mail notificationPreferences')
                    .populate('seller', '_id mail notificationPreferences');

                if (populatedTrade) {
                    this.notificationService.notifyPhaseAdvanced(
                        populatedTrade as any,
                        trade.tradePhase
                    ).catch(err => console.error('Failed to send phase advanced notification:', err));
                }
            }

            return {
                statusCode: 200,
                message: `Document ${status === 'approved' ? 'approved' : 'rejected'} successfully${phaseAdvanced ? `. Trade advanced to ${trade.tradePhase} phase.` : ''}`,
                data: {
                    trade: updatedTrade,
                    document: updatedTrade[fieldName],
                    phaseAdvanced,
                    newPhase: phaseAdvanced ? trade.tradePhase : undefined
                }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to verify document', HttpStatus.INTERNAL_SERVER_ERROR);
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
        signatureDataUrl: string
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
                'sco': 'scoDocument',
                'icpo': 'icpoDocument',
                'spa': 'spaDocument',
                'bol': 'bolDocument',
                'payment-proof': 'paymentProof'
            };

            const fieldName = documentFieldMap[documentType];
            const document = trade[fieldName] as any;

            if (!document || !document.filePath) {
                throw new HttpException(
                    `${documentType.toUpperCase()} document must be uploaded before signing`,
                    HttpStatus.BAD_REQUEST
                );
            }

            // Handle SPA specially - requires BOTH signatures
            if (documentType === 'spa') {
                if (isSeller) {
                    // Check if seller already signed
                    if (document.sellerSignatureDataUrl) {
                        throw new HttpException('Seller has already signed the SPA', HttpStatus.BAD_REQUEST);
                    }
                    document.sellerSignatureDataUrl = signatureDataUrl;
                    document.sellerSignedAt = new Date();
                    document.sellerSignedBy = new Types.ObjectId(userId);
                    trade.spaSellerSignedAt = new Date();
                } else if (isBuyer) {
                    // Check if buyer already signed
                    if (document.buyerSignatureDataUrl) {
                        throw new HttpException('Buyer has already signed the SPA', HttpStatus.BAD_REQUEST);
                    }
                    document.buyerSignatureDataUrl = signatureDataUrl;
                    document.buyerSignedAt = new Date();
                    document.buyerSignedBy = new Types.ObjectId(userId);
                    trade.spaBuyerSignedAt = new Date();
                }

                // Check if BOTH have now signed - advance to PAYMENT phase
                if (document.sellerSignatureDataUrl && document.buyerSignatureDataUrl) {
                    document.status = 'approved';
                    trade.tradePhase = 'PAYMENT';
                }

                // Explicitly set the updated document back to the trade
                trade.spaDocument = document;
            } else {
                // For other documents, single signature
                document.signatureDataUrl = signatureDataUrl;
                document.signedAt = new Date();
                document.signedBy = new Types.ObjectId(userId);

                // Explicitly set back based on document type
                switch (documentType) {
                    case 'sco': trade.scoDocument = document; break;
                    case 'icpo': trade.icpoDocument = document; break;
                    case 'bol': trade.bolDocument = document; break;
                }
            }

            // Mark the document field as modified so Mongoose saves nested changes
            trade.markModified(fieldName as string);

            // Log what we're saving for debugging
            console.log(`Signing ${documentType} document for trade ${tradeId}`);
            console.log(`User is ${isSeller ? 'seller' : 'buyer'}`);
            if (documentType === 'spa') {
                console.log(`SPA sellerSignatureDataUrl: ${trade.spaDocument?.sellerSignatureDataUrl ? 'SET' : 'NOT SET'}`);
                console.log(`SPA buyerSignatureDataUrl: ${trade.spaDocument?.buyerSignatureDataUrl ? 'SET' : 'NOT SET'}`);
            }

            const updatedTrade = await trade.save();

            // Verify the save worked by re-fetching from database
            const verifyTrade = await this.tradeModel.findById(tradeId);
            const verifyDoc = verifyTrade ? verifyTrade[fieldName] as any : null;
            console.log(`Trade saved. Verifying from DB...`);
            if (documentType === 'spa' && verifyDoc) {
                console.log(`DB SPA sellerSignatureDataUrl: ${verifyDoc?.sellerSignatureDataUrl ? 'SET' : 'NOT SET'}`);
                console.log(`DB SPA buyerSignatureDataUrl: ${verifyDoc?.buyerSignatureDataUrl ? 'SET' : 'NOT SET'}`);

                // If verify shows NOT SET but we tried to set it, there's a problem
                if (isSeller && !verifyDoc.sellerSignatureDataUrl) {
                    console.error('ERROR: Seller signature was not saved to database!');
                }
                if (isBuyer && !verifyDoc.buyerSignatureDataUrl) {
                    console.error('ERROR: Buyer signature was not saved to database!');
                }
            }

            // Log audit event (non-blocking)
            this.auditService.logSignatureAdded(
                tradeId,
                userId,
                documentType
            ).catch(err => console.error('Failed to create audit log:', err));

            // Determine message based on SPA signature status
            let message = `${documentType.toUpperCase()} document signed successfully`;
            if (documentType === 'spa') {
                const bothSigned = document.sellerSignatureDataUrl && document.buyerSignatureDataUrl;
                message = bothSigned
                    ? 'SPA fully signed by both parties - advancing to Payment phase'
                    : `SPA signed by ${isSeller ? 'seller' : 'buyer'} - waiting for ${isSeller ? 'buyer' : 'seller'} signature`;
            }

            return {
                statusCode: 200,
                message,
                data: {
                    trade: updatedTrade,
                    document: updatedTrade[fieldName],
                    spaStatus: documentType === 'spa' ? {
                        sellerSigned: !!document.sellerSignatureDataUrl,
                        buyerSigned: !!document.buyerSignatureDataUrl,
                        fullySigned: !!(document.sellerSignatureDataUrl && document.buyerSignatureDataUrl)
                    } : undefined
                }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to sign document', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ========================
    // Helper Methods
    // ========================

    /**
     * Validate verification permissions based on user role
     * SCO → Buyer verifies, ICPO → Seller verifies, SPA → Either
     * Payment Proof → Seller verifies, BoL → Buyer verifies
     */
    private validateVerificationPermissions(
        documentType: DocumentType,
        isSeller: boolean,
        isBuyer: boolean
    ): void {
        switch (documentType) {
            case 'sco':
                if (!isBuyer) {
                    throw new HttpException('Only buyers can verify SCO', HttpStatus.FORBIDDEN);
                }
                break;
            case 'icpo':
                if (!isSeller) {
                    throw new HttpException('Only sellers can verify ICPO', HttpStatus.FORBIDDEN);
                }
                break;
            case 'spa':
                // Either party can verify SPA
                break;
            case 'payment-proof':
                if (!isSeller) {
                    throw new HttpException('Only sellers can verify payment proof', HttpStatus.FORBIDDEN);
                }
                break;
            case 'bol':
                if (!isBuyer) {
                    throw new HttpException('Only buyers can verify BoL', HttpStatus.FORBIDDEN);
                }
                break;
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
        trade: Trade
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
                HttpStatus.BAD_REQUEST
            );
        }

        switch (documentType) {
            case 'sco':
                if (!isSeller) {
                    throw new HttpException('Only sellers can sign SCO', HttpStatus.FORBIDDEN);
                }
                break;
            case 'icpo':
                if (!isBuyer) {
                    throw new HttpException('Only buyers can sign ICPO', HttpStatus.FORBIDDEN);
                }
                break;
            case 'bol':
                if (!isSeller) {
                    throw new HttpException('Only sellers can sign BoL', HttpStatus.FORBIDDEN);
                }
                break;
            case 'payment-proof':
                throw new HttpException('Payment proof documents cannot be signed', HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Get existing document from trade based on document type
     */
    private getExistingDocument(trade: Trade, documentType: DocumentType): DocumentInfo | undefined {
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
        accountToken: string
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
            isCurrent: true
        };

        const history = (document.history || []).map(v => ({
            ...v,
            isCurrent: false
        }));

        return {
            currentVersion,
            versions: [currentVersion, ...history.reverse()],
            totalVersions: history.length + 1
        };
    }

    /**
     * Download a specific version of a document
     */
    async downloadDocumentVersion(
        tradeId: string,
        documentType: DocumentType,
        version: number,
        accountToken: string
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
                mimeType: document.mimeType
            };
        }

        // Find in history
        const historyVersion = (document.history || []).find(v => v.version === version);
        if (!historyVersion) {
            throw new HttpException(`Version ${version} not found`, HttpStatus.NOT_FOUND);
        }

        return {
            filePath: historyVersion.filePath,
            originalName: historyVersion.originalName,
            mimeType: historyVersion.mimeType
        };
    }

    /**
     * Validate document upload permissions based on user role
     */
    private validateDocumentPermissions(
        documentType: DocumentType,
        isSeller: boolean,
        isBuyer: boolean,
        trade: Trade
    ): void {
        // Check if negotiation is accepted first
        if (trade.negotiationStatus !== 'accepted') {
            throw new HttpException(
                'Cannot upload documents before negotiation is accepted',
                HttpStatus.BAD_REQUEST
            );
        }

        switch (documentType) {
            case 'sco':
                if (!isSeller) {
                    throw new HttpException('Only sellers can upload SCO', HttpStatus.FORBIDDEN);
                }
                break;
            case 'icpo':
                if (!isBuyer) {
                    throw new HttpException('Only buyers can upload ICPO', HttpStatus.FORBIDDEN);
                }
                if (!trade.scoDocument) {
                    throw new HttpException('SCO must be uploaded before ICPO', HttpStatus.BAD_REQUEST);
                }
                break;
            case 'spa':
                // Either party can upload SPA
                if (!trade.icpoDocument) {
                    throw new HttpException('ICPO must be uploaded before SPA', HttpStatus.BAD_REQUEST);
                }
                break;
            case 'payment-proof':
                if (!isBuyer) {
                    throw new HttpException('Only buyers can upload payment proof', HttpStatus.FORBIDDEN);
                }
                if (!trade.spaDocument) {
                    throw new HttpException('SPA must be uploaded before payment proof', HttpStatus.BAD_REQUEST);
                }
                break;
            case 'bol':
                if (!isSeller) {
                    throw new HttpException('Only sellers can upload BoL', HttpStatus.FORBIDDEN);
                }
                if (!trade.paymentProof) {
                    throw new HttpException('Payment proof must be uploaded before BoL', HttpStatus.BAD_REQUEST);
                }
                break;
        }
    }

    /**
     * Check if phase should be advanced based on document upload
     */
    private shouldAdvancePhase(currentPhase: TradePhase, newPhase: TradePhase): boolean {
        const phaseOrder: TradePhase[] = ['PR', 'SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL', 'COMPLETED'];
        const currentIndex = phaseOrder.indexOf(currentPhase);
        const newIndex = phaseOrder.indexOf(newPhase);
        return newIndex > currentIndex;
    }

    /**
     * Validate if a phase transition is valid
     */
    private isValidPhaseTransition(currentPhase: TradePhase, newPhase: TradePhase): boolean {
        const phaseOrder: TradePhase[] = ['PR', 'SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL', 'COMPLETED'];
        const currentIndex = phaseOrder.indexOf(currentPhase);
        const newIndex = phaseOrder.indexOf(newPhase);

        // Can only advance to the next phase or stay at current
        return newIndex === currentIndex + 1;
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
            if (trade.negotiationStatus === 'rejected' ||
                trade.negotiationStatus === 'cancelled' ||
                trade.tradePhase === 'COMPLETED' ||
                trade.tradePhase === 'CANCELLED') {
                throw new HttpException('Trade is already closed and cannot be cancelled', HttpStatus.BAD_REQUEST);
            }

            // Check cancellation rules based on trade phase
            const cancellablePhases: string[] = ['PR', 'SCO'];
            const requiresReasonPhases: string[] = ['SCO'];

            // Trades beyond SCO phase cannot be cancelled
            if (!cancellablePhases.includes(trade.tradePhase) &&
                trade.negotiationStatus === 'accepted') {
                throw new HttpException(
                    'Trade cannot be cancelled at this stage. Please contact support.',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Require reason for SCO phase cancellations
            if (requiresReasonPhases.includes(trade.tradePhase) && !reason) {
                throw new HttpException(
                    'A cancellation reason is required at this stage of the trade',
                    HttpStatus.BAD_REQUEST
                );
            }

            // Add cancellation to history
            const historyEntry = {
                round: (trade.currentNegotiationRound || 0) + 1,
                party: isSeller ? 'seller' as const : 'buyer' as const,
                message: `Trade cancelled${reason ? `: ${reason}` : ''}`,
                timestamp: new Date()
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
            this.auditService.logTradeCancelled(
                tradeId,
                userId,
                reason
            ).catch(err => console.error('Failed to create audit log:', err));

            // Send notification (non-blocking)
            const populatedTrade = await this.tradeModel.findById(tradeId)
                .populate('product', '_id name price currency')
                .populate('buyer', '_id mail notificationPreferences')
                .populate('seller', '_id mail notificationPreferences');

            if (populatedTrade) {
                this.notificationService.notifyTradeCancelled(
                    populatedTrade as any,
                    isSeller ? 'seller' : 'buyer',
                    reason || 'Trade was cancelled'
                ).catch(err => console.error('Failed to send cancellation notification:', err));
            }

            return {
                statusCode: 200,
                message: 'Trade cancelled successfully',
                data: updatedTrade
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to cancel trade', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Restore stock when a trade is cancelled or rejected
     */
    /**
     * Restore stock when a trade is cancelled or rejected
     * Uses Optimistic Concurrency Control (OCC) with retries to handle race conditions
     */
    private async restoreStock(trade: Trade) {
        if (!trade.product || !trade.quantity) return;

        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                attempt++;

                // 1. Fetch current product state
                const product = await this.productModel.findById(trade.product);
                if (!product) {
                    console.warn(`Product ${trade.product} not found during stock restoration for trade ${trade._id}`);
                    return;
                }

                const currentStock = parseFloat(product.stock || '0');
                const tradeQty = parseFloat(trade.quantity);

                if (isNaN(currentStock) || isNaN(tradeQty)) {
                    console.warn(`Invalid stock/quantity for product ${product._id} during restoration: Stock=${product.stock}, Qty=${trade.quantity}`);
                    return;
                }

                const newStock = (currentStock + tradeQty).toString();

                // 2. Attempt atomic update using OCC
                // We match BOTH the ID and the stock value we just read
                const updatedProduct = await this.productModel.findOneAndUpdate(
                    {
                        _id: product._id,
                        stock: product.stock
                    },
                    { stock: newStock },
                    { new: true }
                );

                // 3. Check if update was successful
                if (updatedProduct) {
                    console.log(`Successfully restored ${tradeQty} stock for product ${product._id}. New stock: ${newStock}`);
                    return; // Success!
                }

                // If updatedProduct is null, it means stock changed between read and write
                console.log(`Concurrency conflict during stock restoration for product ${product._id} (Attempt ${attempt}/${maxRetries}). Retrying...`);

                // Small delay before retry to reduce contention
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error(`Error attempting to restore stock (Attempt ${attempt}/${maxRetries}):`, error);
            }
        }

        console.error(`Failed to restore stock for trade ${trade._id} after ${maxRetries} attempts due to concurrency or errors.`);
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

            // Get counts for buyer role
            const buyerCounts = await this.tradeModel.aggregate([
                {
                    $match: {
                        buyer: userObjectId,
                        buyerHasUnread: true
                    }
                },
                {
                    $group: {
                        _id: {
                            $cond: [
                                { $in: ['$negotiationStatus', ['pending', 'countered', 'buyer_responded']] },
                                'pr',
                                {
                                    $cond: [
                                        { $eq: ['$negotiationStatus', 'accepted'] },
                                        {
                                            $cond: [
                                                { $in: ['$tradePhase', ['SCO', 'ICPO']] },
                                                'po',
                                                {
                                                    $cond: [
                                                        { $eq: ['$tradePhase', 'SPA'] },
                                                        'spa',
                                                        'ongoing'
                                                    ]
                                                }
                                            ]
                                        },
                                        'other'
                                    ]
                                }
                            ]
                        },
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Get counts for seller role
            const sellerCounts = await this.tradeModel.aggregate([
                {
                    $match: {
                        seller: userObjectId,
                        sellerHasUnread: true
                    }
                },
                {
                    $group: {
                        _id: {
                            $cond: [
                                { $in: ['$negotiationStatus', ['pending', 'countered', 'buyer_responded']] },
                                'pr',
                                {
                                    $cond: [
                                        { $eq: ['$negotiationStatus', 'accepted'] },
                                        {
                                            $cond: [
                                                { $in: ['$tradePhase', ['SCO', 'ICPO']] },
                                                'po',
                                                {
                                                    $cond: [
                                                        { $eq: ['$tradePhase', 'SPA'] },
                                                        'spa',
                                                        'ongoing'
                                                    ]
                                                }
                                            ]
                                        },
                                        'other'
                                    ]
                                }
                            ]
                        },
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Combine counts
            const counts = {
                pr: 0,
                po: 0,
                spa: 0,
                ongoing: 0
            };

            [...buyerCounts, ...sellerCounts].forEach(item => {
                if (item._id && counts.hasOwnProperty(item._id)) {
                    counts[item._id] += item.count;
                }
            });

            return {
                statusCode: 200,
                message: 'Unread counts retrieved successfully',
                data: counts
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to get unread counts', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Mark trades as read for a specific tab type
     */
    async markTradesAsRead(accountToken: string, tabType: 'pr' | 'po' | 'spa' | 'ongoing') {
        try {
            const decodedToken = this.authService.validateAccountToken(accountToken);
            const userId = (decodedToken as any).userId;

            if (!userId) {
                throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
            }

            const userObjectId = new Types.ObjectId(userId);
            const now = new Date();

            // Build query based on tab type
            let statusFilter: any = {};
            switch (tabType) {
                case 'pr':
                    statusFilter = { negotiationStatus: { $in: ['pending', 'countered', 'buyer_responded'] } };
                    break;
                case 'po':
                    statusFilter = {
                        negotiationStatus: 'accepted',
                        tradePhase: { $in: ['SCO', 'ICPO'] }
                    };
                    break;
                case 'spa':
                    statusFilter = {
                        negotiationStatus: 'accepted',
                        tradePhase: 'SPA'
                    };
                    break;
                case 'ongoing':
                    statusFilter = {
                        negotiationStatus: 'accepted',
                        tradePhase: { $in: ['PAYMENT', 'BOL'] }
                    };
                    break;
            }

            // Mark as read for buyer
            await this.tradeModel.updateMany(
                {
                    buyer: userObjectId,
                    buyerHasUnread: true,
                    ...statusFilter
                },
                {
                    $set: {
                        buyerHasUnread: false,
                        lastBuyerViewedAt: now
                    }
                }
            );

            // Mark as read for seller
            await this.tradeModel.updateMany(
                {
                    seller: userObjectId,
                    sellerHasUnread: true,
                    ...statusFilter
                },
                {
                    $set: {
                        sellerHasUnread: false,
                        lastSellerViewedAt: now
                    }
                }
            );

            return {
                statusCode: 200,
                message: 'Trades marked as read',
                data: { tabType, markedAt: now }
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to mark trades as read', HttpStatus.INTERNAL_SERVER_ERROR);
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
                    { $set: { sellerHasUnread: true } }
                );
            } else {
                // Seller acted, mark as unread for buyer
                await this.tradeModel.updateOne(
                    { _id: tradeId },
                    { $set: { buyerHasUnread: true } }
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
        options: TradePaginationDto
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
            const trades = await this.tradeModel.find(query)
                .populate('product', 'name price currency productImages')
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
                hasPrev: page > 1
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to retrieve paginated trades', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get paginated trades for seller
     */
    async getSellerTradesPaginated(
        accountToken: string,
        options: TradePaginationDto
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
            const trades = await this.tradeModel.find(query)
                .populate('product', 'name price currency productImages')
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
                hasPrev: page > 1
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to retrieve paginated trades', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
