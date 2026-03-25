import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Company,
  KycDocument,
  KycDocumentStatus,
} from '../../company/company.schema';
import { User } from '../../users/user.schema';
import { GetKycDocumentsQueryDto } from './dto/get-kyc-documents-query.dto';
import { MailService } from '../../mail/mail.service';
import { NotificationService } from '../../notification/notification.service';
import { ActivityLogService } from '../activity/activity-log.service';

export interface KycDocumentWithCompany {
  document: KycDocument;
  company: {
    _id: Types.ObjectId;
    companyName: string;
    role: string;
    isKycVerified: boolean;
  };
}

export interface PaginatedKycDocumentsResult {
  documents: KycDocumentWithCompany[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

@Injectable()
export class AdminKycService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  /**
   * Get all KYC documents across all companies with pagination
   */
  async getKycDocuments(
    query: GetKycDocumentsQueryDto,
  ): Promise<PaginatedKycDocumentsResult> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      documentType,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
    } = query;

    // Build aggregation pipeline
    const matchStage: any = {
      'kycDocuments.0': { $exists: true },
    };

    if (search) {
      matchStage.companyName = { $regex: search, $options: 'i' };
    }

    // Get all companies with KYC documents
    const companies = await this.companyModel
      .find(matchStage)
      .select('companyName role isKycVerified kycDocuments')
      .lean()
      .exec();

    // Flatten documents with company info
    const allDocuments: KycDocumentWithCompany[] = [];

    for (const company of companies) {
      const docs = company.kycDocuments || [];
      for (const doc of docs) {
        // Apply filters
        if (status && doc.status !== status) continue;
        if (documentType && doc.type !== documentType) continue;

        allDocuments.push({
          document: doc,
          company: {
            _id: company._id as Types.ObjectId,
            companyName: company.companyName,
            role: company.role,
            isKycVerified: company.isKycVerified || false,
          },
        });
      }
    }

    // Sort documents
    const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
    allDocuments.sort((a, b) => {
      const aVal =
        sortBy === 'uploadedAt'
          ? new Date(a.document.uploadedAt).getTime()
          : a.document.customName;
      const bVal =
        sortBy === 'uploadedAt'
          ? new Date(b.document.uploadedAt).getTime()
          : b.document.customName;
      if (aVal < bVal) return -1 * sortMultiplier;
      if (aVal > bVal) return 1 * sortMultiplier;
      return 0;
    });

    // Get stats before pagination
    const stats = {
      pending: allDocuments.filter(
        (d) => d.document.status === KycDocumentStatus.PENDING,
      ).length,
      approved: allDocuments.filter(
        (d) => d.document.status === KycDocumentStatus.APPROVED,
      ).length,
      rejected: allDocuments.filter(
        (d) => d.document.status === KycDocumentStatus.REJECTED,
      ).length,
    };

    // Paginate
    const total = allDocuments.length;
    const skip = (page - 1) * limit;
    const paginatedDocs = allDocuments.slice(skip, skip + limit);

    return {
      documents: paginatedDocs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
    };
  }

  /**
   * Get a single document by company ID and document ID
   */
  async getDocument(
    companyId: string,
    documentId: string,
  ): Promise<KycDocumentWithCompany> {
    if (
      !Types.ObjectId.isValid(companyId) ||
      !Types.ObjectId.isValid(documentId)
    ) {
      throw new BadRequestException('Invalid ID format');
    }

    const company = await this.companyModel
      .findById(companyId)
      .select('companyName role isKycVerified kycDocuments')
      .lean()
      .exec();

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const document = company.kycDocuments?.find(
      (doc) => doc._id.toString() === documentId,
    );

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return {
      document,
      company: {
        _id: company._id as Types.ObjectId,
        companyName: company.companyName,
        role: company.role,
        isKycVerified: company.isKycVerified || false,
      },
    };
  }

  /**
   * Approve a KYC document
   */
  async approveDocument(
    companyId: string,
    documentId: string,
    notes: string,
    adminId: string,
    adminEmail: string,
  ): Promise<KycDocument> {
    if (
      !Types.ObjectId.isValid(companyId) ||
      !Types.ObjectId.isValid(documentId)
    ) {
      throw new BadRequestException('Invalid ID format');
    }

    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const docIndex = company.kycDocuments?.findIndex(
      (doc) => doc._id.toString() === documentId,
    );

    if (docIndex === undefined || docIndex === -1) {
      throw new NotFoundException('Document not found');
    }

    const document = company.kycDocuments[docIndex];

    if (document.status === KycDocumentStatus.APPROVED) {
      throw new BadRequestException('Document is already approved');
    }

    const previousValue = {
      status: document.status,
      reviewedBy: document.reviewedBy,
      reviewedAt: document.reviewedAt,
      reviewNotes: document.reviewNotes,
    };

    // Update document
    document.status = KycDocumentStatus.APPROVED;
    document.reviewedBy = new Types.ObjectId(adminId);
    document.reviewedAt = new Date();
    document.reviewNotes = notes || '';

    // Mark nested array as modified (Mongoose doesn't auto-detect nested object changes)
    company.markModified('kycDocuments');
    await company.save();

    // Get company users to notify
    const users = await this.userModel.find({ company: companyId }).lean();

    // Send notifications
    for (const user of users) {
      await this.notificationService.createNotification({
        userId: user._id.toString(),
        type: 'kyc_document_approved',
        title: 'Document Approved',
        message: `Your document "${document.customName}" has been approved.`,
        priority: 'normal',
      });

      try {
        await this.mailService.sendTradeNotificationEmail(
          user.mail,
          'Document Approved - Breyus',
          `<h2>Document Approved</h2>
          <p>Good news! Your document <strong>${document.customName}</strong> has been approved.</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}`,
        );
      } catch (error) {
        console.error('Failed to send approval email:', error);
      }
    }

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'kyc.document_approve',
      actionCategory: 'kyc',
      targetType: 'kyc_document',
      targetId: new Types.ObjectId(documentId),
      targetIdentifier: `${company.companyName} - ${document.customName}`,
      description: `Approved document "${document.customName}" for ${company.companyName}`,
      previousValue,
      newValue: {
        status: KycDocumentStatus.APPROVED,
        reviewedBy: adminId,
        reviewedAt: document.reviewedAt,
        reviewNotes: notes,
      },
      metadata: { companyId },
    });

    return document;
  }

  /**
   * Reject a KYC document
   */
  async rejectDocument(
    companyId: string,
    documentId: string,
    notes: string,
    adminId: string,
    adminEmail: string,
  ): Promise<KycDocument> {
    if (
      !Types.ObjectId.isValid(companyId) ||
      !Types.ObjectId.isValid(documentId)
    ) {
      throw new BadRequestException('Invalid ID format');
    }

    if (!notes || notes.trim().length < 10) {
      throw new BadRequestException(
        'Please provide a reason for rejection (at least 10 characters)',
      );
    }

    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const docIndex = company.kycDocuments?.findIndex(
      (doc) => doc._id.toString() === documentId,
    );

    if (docIndex === undefined || docIndex === -1) {
      throw new NotFoundException('Document not found');
    }

    const document = company.kycDocuments[docIndex];

    if (document.status === KycDocumentStatus.REJECTED) {
      throw new BadRequestException('Document is already rejected');
    }

    const previousValue = {
      status: document.status,
      reviewedBy: document.reviewedBy,
      reviewedAt: document.reviewedAt,
      reviewNotes: document.reviewNotes,
    };

    // Update document
    document.status = KycDocumentStatus.REJECTED;
    document.reviewedBy = new Types.ObjectId(adminId);
    document.reviewedAt = new Date();
    document.reviewNotes = notes;

    // Mark nested array as modified (Mongoose doesn't auto-detect nested object changes)
    company.markModified('kycDocuments');
    await company.save();

    // Get company users to notify
    const users = await this.userModel.find({ company: companyId }).lean();

    // Send notifications
    for (const user of users) {
      await this.notificationService.createNotification({
        userId: user._id.toString(),
        type: 'kyc_document_rejected',
        title: 'Document Rejected',
        message: `Your document "${document.customName}" has been rejected. Reason: ${notes}`,
        priority: 'high',
      });

      try {
        await this.mailService.sendTradeNotificationEmail(
          user.mail,
          'Document Rejected - Breyus',
          `<h2>Document Rejected</h2>
          <p>Unfortunately, your document <strong>${document.customName}</strong> has been rejected.</p>
          <p><strong>Reason:</strong> ${notes}</p>
          <p>Please review the feedback and upload a new document if needed.</p>`,
        );
      } catch (error) {
        console.error('Failed to send rejection email:', error);
      }
    }

    // Log the action
    await this.activityLogService.log({
      adminId: new Types.ObjectId(adminId),
      adminEmail,
      action: 'kyc.document_reject',
      actionCategory: 'kyc',
      targetType: 'kyc_document',
      targetId: new Types.ObjectId(documentId),
      targetIdentifier: `${company.companyName} - ${document.customName}`,
      description: `Rejected document "${document.customName}" for ${company.companyName}. Reason: ${notes}`,
      previousValue,
      newValue: {
        status: KycDocumentStatus.REJECTED,
        reviewedBy: adminId,
        reviewedAt: document.reviewedAt,
        reviewNotes: notes,
      },
      metadata: { companyId },
    });

    return document;
  }

  /**
   * Get KYC summary stats
   */
  async getKycStats(): Promise<{
    pendingDocuments: number;
    verifiedCompanies: number;
    unverifiedCompanies: number;
    totalDocuments: number;
  }> {
    const companies = await this.companyModel
      .find({ 'kycDocuments.0': { $exists: true } })
      .select('isKycVerified kycDocuments')
      .lean()
      .exec();

    let pendingDocuments = 0;
    let totalDocuments = 0;
    let verifiedCompanies = 0;
    let unverifiedCompanies = 0;

    for (const company of companies) {
      const docs = company.kycDocuments || [];
      totalDocuments += docs.length;
      pendingDocuments += docs.filter(
        (d: any) => d.status === KycDocumentStatus.PENDING,
      ).length;

      if (company.isKycVerified) {
        verifiedCompanies++;
      } else {
        unverifiedCompanies++;
      }
    }

    return {
      pendingDocuments,
      verifiedCompanies,
      unverifiedCompanies,
      totalDocuments,
    };
  }
}
