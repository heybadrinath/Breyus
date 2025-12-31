import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditAction } from './schema/audit-log.schema';

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
    ) {}

    /**
     * Log an audit event
     */
    async log(
        tradeId: string,
        userId: string,
        action: AuditAction,
        details?: string,
        previousState?: Record<string, any>,
        newState?: Record<string, any>,
        documentType?: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<AuditLog> {
        try {
            const auditLog = new this.auditLogModel({
                trade: new Types.ObjectId(tradeId),
                performedBy: new Types.ObjectId(userId),
                action,
                details,
                previousState,
                newState,
                documentType,
                ipAddress,
                userAgent,
            });

            const savedLog = await auditLog.save();
            this.logger.debug(`Audit log created for trade ${tradeId}: ${action}`);
            return savedLog;
        } catch (error) {
            this.logger.error(`Failed to create audit log: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get audit history for a trade
     */
    async getAuditHistory(
        tradeId: string,
        options?: {
            limit?: number;
            offset?: number;
            action?: AuditAction;
        }
    ): Promise<{ logs: AuditLog[]; total: number }> {
        try {
            const query: any = { trade: new Types.ObjectId(tradeId) };

            if (options?.action) {
                query.action = options.action;
            }

            const total = await this.auditLogModel.countDocuments(query);

            const logs = await this.auditLogModel.find(query)
                .populate('performedBy', 'mail')
                .sort({ createdAt: -1 })
                .skip(options?.offset || 0)
                .limit(options?.limit || 50);

            return { logs, total };
        } catch (error) {
            this.logger.error(`Failed to get audit history: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get audit logs for a specific user
     */
    async getUserAuditHistory(
        userId: string,
        options?: {
            limit?: number;
            offset?: number;
        }
    ): Promise<{ logs: AuditLog[]; total: number }> {
        try {
            const query = { performedBy: new Types.ObjectId(userId) };

            const total = await this.auditLogModel.countDocuments(query);

            const logs = await this.auditLogModel.find(query)
                .populate('trade', '_id tradePhase')
                .sort({ createdAt: -1 })
                .skip(options?.offset || 0)
                .limit(options?.limit || 50);

            return { logs, total };
        } catch (error) {
            this.logger.error(`Failed to get user audit history: ${error.message}`);
            throw error;
        }
    }

    /**
     * Log trade creation
     */
    async logTradeCreated(
        tradeId: string,
        userId: string,
        tradeData: Record<string, any>
    ): Promise<AuditLog> {
        return this.log(
            tradeId,
            userId,
            'trade_created',
            'Trade request created',
            undefined,
            tradeData
        );
    }

    /**
     * Log counter offer
     */
    async logCounterOffer(
        tradeId: string,
        userId: string,
        previousOffer: Record<string, any>,
        newOffer: Record<string, any>
    ): Promise<AuditLog> {
        return this.log(
            tradeId,
            userId,
            'counter_offer',
            `Counter offer submitted: ${newOffer.offeredPrice || 'N/A'}`,
            previousOffer,
            newOffer
        );
    }

    /**
     * Log buyer response
     */
    async logBuyerResponse(
        tradeId: string,
        userId: string,
        previousOffer: Record<string, any>,
        newOffer: Record<string, any>
    ): Promise<AuditLog> {
        return this.log(
            tradeId,
            userId,
            'buyer_response',
            `Buyer response submitted: ${newOffer.offeredPrice || 'N/A'}`,
            previousOffer,
            newOffer
        );
    }

    /**
     * Log trade accepted
     */
    async logTradeAccepted(
        tradeId: string,
        userId: string,
        finalTerms: Record<string, any>
    ): Promise<AuditLog> {
        return this.log(
            tradeId,
            userId,
            'accepted',
            'Trade accepted',
            undefined,
            finalTerms
        );
    }

    /**
     * Log trade rejected
     */
    async logTradeRejected(
        tradeId: string,
        userId: string,
        reason?: string
    ): Promise<AuditLog> {
        return this.log(
            tradeId,
            userId,
            'rejected',
            reason || 'Trade rejected',
            undefined,
            { reason }
        );
    }

    /**
     * Log trade cancelled
     */
    async logTradeCancelled(
        tradeId: string,
        userId: string,
        reason?: string
    ): Promise<AuditLog> {
        return this.log(
            tradeId,
            userId,
            'cancelled',
            reason || 'Trade cancelled',
            undefined,
            { reason }
        );
    }

    /**
     * Log document uploaded
     */
    async logDocumentUploaded(
        tradeId: string,
        userId: string,
        documentType: string,
        documentInfo: Record<string, any>
    ): Promise<AuditLog> {
        return this.log(
            tradeId,
            userId,
            'document_uploaded',
            `${documentType.toUpperCase()} document uploaded`,
            undefined,
            documentInfo,
            documentType
        );
    }

    /**
     * Log document verification
     */
    async logDocumentVerified(
        tradeId: string,
        userId: string,
        documentType: string,
        status: 'approved' | 'rejected',
        notes?: string
    ): Promise<AuditLog> {
        const action = status === 'approved' ? 'document_verified' : 'document_rejected';
        return this.log(
            tradeId,
            userId,
            action,
            `${documentType.toUpperCase()} document ${status}${notes ? ': ' + notes : ''}`,
            undefined,
            { status, notes },
            documentType
        );
    }

    /**
     * Log phase advancement
     */
    async logPhaseAdvanced(
        tradeId: string,
        userId: string,
        previousPhase: string,
        newPhase: string
    ): Promise<AuditLog> {
        return this.log(
            tradeId,
            userId,
            'phase_advanced',
            `Trade phase advanced from ${previousPhase} to ${newPhase}`,
            { phase: previousPhase },
            { phase: newPhase }
        );
    }

    /**
     * Log trade completed
     */
    async logTradeCompleted(
        tradeId: string,
        userId: string,
        summary: Record<string, any>
    ): Promise<AuditLog> {
        return this.log(
            tradeId,
            userId,
            'trade_completed',
            'Trade completed successfully',
            undefined,
            summary
        );
    }

    /**
     * Log signature added
     */
    async logSignatureAdded(
        tradeId: string,
        userId: string,
        documentType: string
    ): Promise<AuditLog> {
        return this.log(
            tradeId,
            userId,
            'signature_added',
            `Signature added to ${documentType.toUpperCase()} document`,
            undefined,
            { documentType },
            documentType
        );
    }
}
