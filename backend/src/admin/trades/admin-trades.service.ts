import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Trade, AdminNote } from '../../trade/schema/trade.schema';
import { User } from '../../users/user.schema';
import { Product } from '../../products/schema/products.schema';
import { GetTradesQueryDto } from './dto/get-trades-query.dto';
import { AddTradeNoteDto } from './dto/add-trade-note.dto';
import { VerifyDocumentDto, VerifiableDocumentType } from './dto/verify-document.dto';
import { ForcePhaseChangeDto } from './dto/force-phase.dto';
import { ActivityLogService } from '../activity/activity-log.service';

export interface PaginatedTradesResult {
  trades: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TradeStats {
  totalTrades: number;
  activeTrades: number;
  completedTrades: number;
  cancelledTrades: number;
  stalledTrades: number;
  disputedTrades: number;
  byPhase: Record<string, number>;
  byNegotiationStatus: Record<string, number>;
}

export interface TradeTimelineEvent {
  type: string;
  description: string;
  timestamp: Date;
  actor?: string;
  actorType?: 'buyer' | 'seller' | 'admin' | 'system';
  metadata?: Record<string, any>;
}

@Injectable()
export class AdminTradesService {
  constructor(
    @InjectModel(Trade.name) private tradeModel: Model<Trade>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  /**
   * Get paginated list of trades with filters
   */
  async getTrades(query: GetTradesQueryDto): Promise<PaginatedTradesResult> {
    const {
      page = 1,
      limit = 20,
      search,
      negotiationStatus,
      tradePhase,
      buyerId,
      sellerId,
      isStalled,
      hasDispute,
      dateFrom,
      dateTo,
      minValue,
      maxValue,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      stalledDays = 7,
    } = query;

    const filter: any = {};

    // Search by trade ID or user email
    if (search) {
      // Check if search is a valid ObjectId (trade ID)
      if (Types.ObjectId.isValid(search)) {
        filter._id = new Types.ObjectId(search);
      } else {
        // Search by buyer or seller email - we'll need to find user IDs first
        const users = await this.userModel
          .find({ mail: { $regex: search, $options: 'i' } })
          .select('_id')
          .lean();
        const userIds = users.map((u) => u._id);
        if (userIds.length > 0) {
          filter.$or = [{ buyer: { $in: userIds } }, { seller: { $in: userIds } }];
        } else {
          // No matching users, return empty result
          return { trades: [], total: 0, page, limit, totalPages: 0 };
        }
      }
    }

    // Filter by negotiation status
    if (negotiationStatus) {
      filter.negotiationStatus = negotiationStatus;
    }

    // Filter by trade phase
    if (tradePhase) {
      filter.tradePhase = tradePhase;
    }

    // Filter by buyer
    if (buyerId && Types.ObjectId.isValid(buyerId)) {
      filter.buyer = new Types.ObjectId(buyerId);
    }

    // Filter by seller
    if (sellerId && Types.ObjectId.isValid(sellerId)) {
      filter.seller = new Types.ObjectId(sellerId);
    }

    // Filter by stalled trades
    if (isStalled === true) {
      const stalledThreshold = new Date();
      stalledThreshold.setDate(stalledThreshold.getDate() - stalledDays);
      filter.tradePhase = { $nin: ['COMPLETED', 'CANCELLED'] };
      filter.$or = [
        { lastPhaseChangeAt: { $lt: stalledThreshold } },
        { lastPhaseChangeAt: null, updatedAt: { $lt: stalledThreshold } },
      ];
    }

    // Filter by has dispute
    if (hasDispute === true) {
      filter.activeDispute = { $ne: null };
    } else if (hasDispute === false) {
      filter.activeDispute = null;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [trades, total] = await Promise.all([
      this.tradeModel
        .find(filter)
        .populate({
          path: 'buyer',
          select: 'mail company',
          populate: { path: 'company', select: 'companyName' },
        })
        .populate({
          path: 'seller',
          select: 'mail company',
          populate: { path: 'company', select: 'companyName' },
        })
        .populate('product', 'name price currency productImages')
        .populate('activeDispute', 'status priority')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.tradeModel.countDocuments(filter).exec(),
    ]);

    // Add computed fields (isStalled)
    const stalledThreshold = new Date();
    stalledThreshold.setDate(stalledThreshold.getDate() - stalledDays);

    const tradesWithComputed = trades.map((trade: any) => {
      const phaseDate = trade.lastPhaseChangeAt || trade.updatedAt;
      const isTradeStalled =
        !['COMPLETED', 'CANCELLED'].includes(trade.tradePhase) &&
        new Date(phaseDate) < stalledThreshold;

      return {
        ...trade,
        isStalled: isTradeStalled,
        daysSincePhaseChange: Math.floor(
          (Date.now() - new Date(phaseDate).getTime()) / (1000 * 60 * 60 * 24),
        ),
      };
    });

    return {
      trades: tradesWithComputed,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get trade statistics
   */
  async getTradeStats(): Promise<TradeStats> {
    const stalledThreshold = new Date();
    stalledThreshold.setDate(stalledThreshold.getDate() - 7);

    const [
      totalTrades,
      activeTrades,
      completedTrades,
      cancelledTrades,
      stalledTrades,
      disputedTrades,
      phaseAggregation,
      statusAggregation,
    ] = await Promise.all([
      this.tradeModel.countDocuments(),
      this.tradeModel.countDocuments({
        tradePhase: { $nin: ['COMPLETED', 'CANCELLED'] },
      }),
      this.tradeModel.countDocuments({ tradePhase: 'COMPLETED' }),
      this.tradeModel.countDocuments({ tradePhase: 'CANCELLED' }),
      this.tradeModel.countDocuments({
        tradePhase: { $nin: ['COMPLETED', 'CANCELLED'] },
        $or: [
          { lastPhaseChangeAt: { $lt: stalledThreshold } },
          { lastPhaseChangeAt: null, updatedAt: { $lt: stalledThreshold } },
        ],
      }),
      this.tradeModel.countDocuments({ activeDispute: { $ne: null } }),
      this.tradeModel.aggregate([
        { $group: { _id: '$tradePhase', count: { $sum: 1 } } },
      ]),
      this.tradeModel.aggregate([
        { $group: { _id: '$negotiationStatus', count: { $sum: 1 } } },
      ]),
    ]);

    const byPhase: Record<string, number> = {};
    phaseAggregation.forEach((item: any) => {
      byPhase[item._id || 'unknown'] = item.count;
    });

    const byNegotiationStatus: Record<string, number> = {};
    statusAggregation.forEach((item: any) => {
      byNegotiationStatus[item._id || 'unknown'] = item.count;
    });

    return {
      totalTrades,
      activeTrades,
      completedTrades,
      cancelledTrades,
      stalledTrades,
      disputedTrades,
      byPhase,
      byNegotiationStatus,
    };
  }

  /**
   * Get stalled trades (trades stuck in a phase for more than X days)
   */
  async getStalledTrades(days: number = 7): Promise<any[]> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);

    const trades = await this.tradeModel
      .find({
        tradePhase: { $nin: ['COMPLETED', 'CANCELLED'] },
        $or: [
          { lastPhaseChangeAt: { $lt: threshold } },
          { lastPhaseChangeAt: null, updatedAt: { $lt: threshold } },
        ],
      })
      .populate({
        path: 'buyer',
        select: 'mail company',
        populate: { path: 'company', select: 'companyName' },
      })
      .populate({
        path: 'seller',
        select: 'mail company',
        populate: { path: 'company', select: 'companyName' },
      })
      .populate('product', 'name price currency')
      .sort({ lastPhaseChangeAt: 1, updatedAt: 1 })
      .lean()
      .exec();

    return trades.map((trade: any) => {
      const phaseDate = trade.lastPhaseChangeAt || trade.updatedAt;
      return {
        ...trade,
        daysSincePhaseChange: Math.floor(
          (Date.now() - new Date(phaseDate).getTime()) / (1000 * 60 * 60 * 24),
        ),
      };
    });
  }

  /**
   * Get trade by ID with full details
   */
  async getTradeById(tradeId: string): Promise<any> {
    if (!Types.ObjectId.isValid(tradeId)) {
      throw new BadRequestException('Invalid trade ID');
    }

    const trade = await this.tradeModel
      .findById(tradeId)
      .populate({
        path: 'buyer',
        select: 'mail company',
        populate: { path: 'company', select: 'companyName role isVerified' },
      })
      .populate({
        path: 'seller',
        select: 'mail company',
        populate: { path: 'company', select: 'companyName role isVerified' },
      })
      .populate('product')
      .populate('activeDispute')
      .lean()
      .exec();

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    // Compute stalled status
    const stalledThreshold = new Date();
    stalledThreshold.setDate(stalledThreshold.getDate() - 7);
    const phaseDate = (trade as any).lastPhaseChangeAt || (trade as any).updatedAt;
    const isStalled =
      !['COMPLETED', 'CANCELLED'].includes((trade as any).tradePhase) &&
      new Date(phaseDate) < stalledThreshold;

    return {
      ...trade,
      isStalled,
      daysSincePhaseChange: Math.floor(
        (Date.now() - new Date(phaseDate).getTime()) / (1000 * 60 * 60 * 24),
      ),
    };
  }

  /**
   * Get trade timeline (all events in chronological order)
   */
  async getTradeTimeline(tradeId: string): Promise<TradeTimelineEvent[]> {
    if (!Types.ObjectId.isValid(tradeId)) {
      throw new BadRequestException('Invalid trade ID');
    }

    const trade = await this.tradeModel
      .findById(tradeId)
      .populate('buyer', 'mail')
      .populate('seller', 'mail')
      .lean()
      .exec();

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    const events: TradeTimelineEvent[] = [];
    const tradeData = trade as any;

    // Trade created
    events.push({
      type: 'trade_created',
      description: 'Purchase request created',
      timestamp: tradeData.createdAt,
      actor: tradeData.buyer?.mail,
      actorType: 'buyer',
    });

    // Negotiation history
    if (tradeData.negotiationHistory && tradeData.negotiationHistory.length > 0) {
      tradeData.negotiationHistory.forEach((entry: any) => {
        events.push({
          type: 'negotiation',
          description: `${entry.party === 'buyer' ? 'Buyer' : 'Seller'} ${
            entry.offeredPrice ? `offered $${entry.offeredPrice}` : 'responded'
          }`,
          timestamp: entry.timestamp,
          actor: entry.party === 'buyer' ? tradeData.buyer?.mail : tradeData.seller?.mail,
          actorType: entry.party,
          metadata: {
            round: entry.round,
            offeredPrice: entry.offeredPrice,
            message: entry.message,
          },
        });
      });
    }

    // Acceptance/Rejection
    if (tradeData.acceptedAt) {
      events.push({
        type: 'trade_accepted',
        description: 'Trade accepted',
        timestamp: tradeData.acceptedAt,
        actorType: 'system',
      });
    }
    if (tradeData.rejectedAt) {
      events.push({
        type: 'trade_rejected',
        description: `Trade rejected: ${tradeData.rejectionReason || 'No reason provided'}`,
        timestamp: tradeData.rejectedAt,
        actorType: 'system',
      });
    }

    // Document uploads
    if (tradeData.scoSubmittedAt) {
      events.push({
        type: 'document_uploaded',
        description: 'SCO document uploaded',
        timestamp: tradeData.scoSubmittedAt,
        actor: tradeData.seller?.mail,
        actorType: 'seller',
      });
    }
    if (tradeData.icpoSubmittedAt) {
      events.push({
        type: 'document_uploaded',
        description: 'ICPO document uploaded',
        timestamp: tradeData.icpoSubmittedAt,
        actor: tradeData.buyer?.mail,
        actorType: 'buyer',
      });
    }
    if (tradeData.spaUploadedAt) {
      events.push({
        type: 'document_uploaded',
        description: 'SPA document uploaded',
        timestamp: tradeData.spaUploadedAt,
        actorType: 'system',
      });
    }
    if (tradeData.spaSellerSignedAt) {
      events.push({
        type: 'document_signed',
        description: 'SPA signed by seller',
        timestamp: tradeData.spaSellerSignedAt,
        actor: tradeData.seller?.mail,
        actorType: 'seller',
      });
    }
    if (tradeData.spaBuyerSignedAt) {
      events.push({
        type: 'document_signed',
        description: 'SPA signed by buyer',
        timestamp: tradeData.spaBuyerSignedAt,
        actor: tradeData.buyer?.mail,
        actorType: 'buyer',
      });
    }
    if (tradeData.paymentVerifiedAt) {
      events.push({
        type: 'payment_verified',
        description: 'Payment proof verified',
        timestamp: tradeData.paymentVerifiedAt,
        actorType: 'system',
      });
    }
    if (tradeData.bolUploadedAt) {
      events.push({
        type: 'document_uploaded',
        description: 'Bill of Lading uploaded',
        timestamp: tradeData.bolUploadedAt,
        actor: tradeData.seller?.mail,
        actorType: 'seller',
      });
    }
    if (tradeData.completedAt) {
      events.push({
        type: 'trade_completed',
        description: 'Trade completed',
        timestamp: tradeData.completedAt,
        actorType: 'system',
      });
    }
    if (tradeData.cancelledAt) {
      events.push({
        type: 'trade_cancelled',
        description: `Trade cancelled: ${tradeData.cancellationReason || 'No reason provided'}`,
        timestamp: tradeData.cancelledAt,
        actorType: 'system',
      });
    }

    // Admin notes
    if (tradeData.adminNotes && tradeData.adminNotes.length > 0) {
      tradeData.adminNotes.forEach((note: AdminNote) => {
        events.push({
          type: 'admin_note',
          description: `Admin note: ${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}`,
          timestamp: note.addedAt,
          actor: note.addedByEmail,
          actorType: 'admin',
          metadata: { noteId: note._id, content: note.content },
        });
      });
    }

    // Sort by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return events;
  }

  /**
   * Add admin note to trade
   */
  async addTradeNote(
    tradeId: string,
    noteDto: AddTradeNoteDto,
    adminId: string,
    adminEmail: string,
  ): Promise<AdminNote> {
    if (!Types.ObjectId.isValid(tradeId)) {
      throw new BadRequestException('Invalid trade ID');
    }

    const trade = await this.tradeModel.findById(tradeId).lean();
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    const newNote: AdminNote = {
      _id: new Types.ObjectId(),
      content: noteDto.content,
      addedBy: new Types.ObjectId(adminId),
      addedByEmail: adminEmail,
      addedAt: new Date(),
    };

    await this.tradeModel.findByIdAndUpdate(
      tradeId,
      { $push: { adminNotes: newNote } },
    );

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'trade.add_note',
      actionCategory: 'trades',
      targetType: 'trade',
      targetId: new Types.ObjectId(tradeId),
      targetIdentifier: tradeId,
      description: `Added admin note to trade ${tradeId}`,
      previousValue: undefined,
      newValue: { noteId: newNote._id, content: noteDto.content },
      metadata: {},
    });

    return newNote;
  }

  /**
   * Get admin notes for a trade
   */
  async getTradeNotes(tradeId: string): Promise<AdminNote[]> {
    if (!Types.ObjectId.isValid(tradeId)) {
      throw new BadRequestException('Invalid trade ID');
    }

    const trade = await this.tradeModel
      .findById(tradeId)
      .select('adminNotes')
      .lean()
      .exec();

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    return ((trade as any).adminNotes || []).sort(
      (a: AdminNote, b: AdminNote) =>
        new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
    );
  }

  /**
   * Delete admin note from trade
   */
  async deleteTradeNote(
    tradeId: string,
    noteId: string,
    adminId: string,
    adminEmail: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(tradeId)) {
      throw new BadRequestException('Invalid trade ID');
    }
    if (!Types.ObjectId.isValid(noteId)) {
      throw new BadRequestException('Invalid note ID');
    }

    const trade = await this.tradeModel.findById(tradeId).lean();
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    const note = ((trade as any).adminNotes || []).find(
      (n: AdminNote) => n._id.toString() === noteId,
    );
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    await this.tradeModel.findByIdAndUpdate(
      tradeId,
      { $pull: { adminNotes: { _id: new Types.ObjectId(noteId) } } },
    );

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'trade.delete_note',
      actionCategory: 'trades',
      targetType: 'trade',
      targetId: new Types.ObjectId(tradeId),
      targetIdentifier: tradeId,
      description: `Deleted admin note from trade ${tradeId}`,
      previousValue: { noteId, content: note.content },
      newValue: undefined,
      metadata: {},
    });
  }

  // ========================
  // DOCUMENT VERIFICATION
  // ========================

  /**
   * Map document type string to schema field name
   */
  private getDocumentFieldName(documentType: VerifiableDocumentType): string {
    const mapping: Record<VerifiableDocumentType, string> = {
      sco: 'scoDocument',
      icpo: 'icpoDocument',
      spa: 'spaDocument',
      bol: 'bolDocument',
      'payment-proof': 'paymentProof',
    };
    return mapping[documentType];
  }

  /**
   * Verify or reject a trade document
   * Admin can approve or reject documents with optional notes
   */
  async verifyDocument(
    tradeId: string,
    dto: VerifyDocumentDto,
    adminId: string,
    adminEmail: string,
  ): Promise<{ documentType: string; status: string; verifiedBy: string; verifiedAt: Date; notes?: string }> {
    if (!Types.ObjectId.isValid(tradeId)) {
      throw new BadRequestException('Invalid trade ID');
    }

    const trade = await this.tradeModel.findById(tradeId).lean();
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    const fieldName = this.getDocumentFieldName(dto.documentType);
    const document = (trade as any)[fieldName];

    if (!document) {
      throw new BadRequestException(`No ${dto.documentType.toUpperCase()} document has been uploaded yet`);
    }

    // If rejecting, notes are required
    if (dto.status === 'rejected' && !dto.notes) {
      throw new BadRequestException('Notes are required when rejecting a document');
    }

    const previousStatus = document.status;
    const verifiedAt = new Date();

    // Update the document status
    const updateData: any = {
      [`${fieldName}.status`]: dto.status,
      [`${fieldName}.verifiedBy`]: new Types.ObjectId(adminId),
      [`${fieldName}.verifiedByEmail`]: adminEmail,
      [`${fieldName}.verifiedAt`]: verifiedAt,
    };

    if (dto.notes) {
      updateData[`${fieldName}.notes`] = dto.notes;
    }

    await this.tradeModel.findByIdAndUpdate(tradeId, { $set: updateData });

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'trade.verify_document',
      actionCategory: 'trades',
      targetType: 'trade',
      targetId: new Types.ObjectId(tradeId),
      targetIdentifier: tradeId,
      description: `${dto.status === 'approved' ? 'Approved' : 'Rejected'} ${dto.documentType.toUpperCase()} document for trade ${tradeId}`,
      previousValue: { status: previousStatus },
      newValue: { status: dto.status, notes: dto.notes },
      metadata: { documentType: dto.documentType },
    });

    return {
      documentType: dto.documentType,
      status: dto.status,
      verifiedBy: adminEmail,
      verifiedAt,
      notes: dto.notes,
    };
  }

  // ========================
  // FORCE PHASE CHANGE
  // ========================

  /**
   * Force change trade phase (admin override)
   * Allows admins to manually advance or revert trade phases
   */
  async forcePhaseChange(
    tradeId: string,
    dto: ForcePhaseChangeDto,
    adminId: string,
    adminEmail: string,
  ): Promise<{ previousPhase: string; newPhase: string; changedBy: string; changedAt: Date; reason: string }> {
    if (!Types.ObjectId.isValid(tradeId)) {
      throw new BadRequestException('Invalid trade ID');
    }

    const trade = await this.tradeModel.findById(tradeId).lean();
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    const previousPhase = (trade as any).tradePhase;

    // Don't allow changing to the same phase
    if (previousPhase === dto.newPhase) {
      throw new BadRequestException(`Trade is already in phase ${dto.newPhase}`);
    }

    const changedAt = new Date();

    // Update trade phase
    const updateData: any = {
      tradePhase: dto.newPhase,
      lastPhaseChangeAt: changedAt,
    };

    // Set completion or cancellation timestamps if applicable
    if (dto.newPhase === 'COMPLETED') {
      updateData.completedAt = changedAt;
    } else if (dto.newPhase === 'CANCELLED') {
      updateData.cancelledAt = changedAt;
      updateData.cancelledBy = new Types.ObjectId(adminId);
      updateData.cancellationReason = `Admin force-change: ${dto.reason}`;
    }

    await this.tradeModel.findByIdAndUpdate(tradeId, { $set: updateData });

    // Add admin note explaining the phase change
    const noteContent = `Phase changed from ${previousPhase} to ${dto.newPhase}. Reason: ${dto.reason}`;
    await this.addTradeNote(
      tradeId,
      { content: noteContent },
      adminId,
      adminEmail,
    );

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'trade.force_phase',
      actionCategory: 'trades',
      targetType: 'trade',
      targetId: new Types.ObjectId(tradeId),
      targetIdentifier: tradeId,
      description: `Force-changed trade phase from ${previousPhase} to ${dto.newPhase}`,
      previousValue: { phase: previousPhase },
      newValue: { phase: dto.newPhase, reason: dto.reason },
      metadata: { notifyParties: dto.notifyParties || false },
    });

    // TODO: If dto.notifyParties is true, send email notifications to buyer and seller
    // This can be implemented later with the mail service

    return {
      previousPhase,
      newPhase: dto.newPhase,
      changedBy: adminEmail,
      changedAt,
      reason: dto.reason,
    };
  }

  // ========================
  // DOCUMENT DOWNLOAD
  // ========================

  /**
   * Get document download info for streaming
   * Returns file path, original name, and mime type
   */
  async getDocumentDownloadInfo(
    tradeId: string,
    documentType: string,
  ): Promise<{ filePath: string; originalName: string; mimeType: string }> {
    if (!Types.ObjectId.isValid(tradeId)) {
      throw new BadRequestException('Invalid trade ID');
    }

    // Validate document type
    const validTypes = ['sco', 'icpo', 'spa', 'bol', 'payment-proof'];
    if (!validTypes.includes(documentType)) {
      throw new BadRequestException(`Invalid document type. Must be one of: ${validTypes.join(', ')}`);
    }

    const trade = await this.tradeModel.findById(tradeId).lean();
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    const fieldName = this.getDocumentFieldName(documentType as VerifiableDocumentType);
    const document = (trade as any)[fieldName];

    if (!document) {
      throw new NotFoundException(`No ${documentType.toUpperCase()} document has been uploaded for this trade`);
    }

    if (!document.filePath) {
      throw new NotFoundException('Document file path not found');
    }

    return {
      filePath: document.filePath,
      originalName: document.originalName || `${documentType}-document`,
      mimeType: document.mimeType || 'application/octet-stream',
    };
  }
}
