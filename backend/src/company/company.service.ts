import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Company,
  DeliveryAddress,
  BankInfo,
  TradeDetails,
  KycDocument,
  KycDocumentType,
  KycDocumentStatus,
  BillingPreferences,
  Role,
} from './company.schema';
import { PublicCompanyProfileDto } from './dto/public-company-profile.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
  ) {}

  async addDeliveryAddress(
    companyId: string,
    address: DeliveryAddress,
  ): Promise<Company> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      // Add the new address to the deliveryAddresses array
      company.deliveryAddresses.push(address);
      await company.save();

      return company;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to add delivery address',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getDeliveryAddresses(companyId: string): Promise<DeliveryAddress[]> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      return company.deliveryAddresses || [];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get delivery addresses',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateDeliveryAddress(
    companyId: string,
    addressIndex: number,
    address: DeliveryAddress,
  ): Promise<Company> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      if (
        addressIndex < 0 ||
        addressIndex >= company.deliveryAddresses.length
      ) {
        throw new HttpException(
          'Invalid address index',
          HttpStatus.BAD_REQUEST,
        );
      }

      company.deliveryAddresses[addressIndex] = address;
      await company.save();

      return company;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update delivery address',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteDeliveryAddress(
    companyId: string,
    addressIndex: number,
  ): Promise<Company> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      if (
        addressIndex < 0 ||
        addressIndex >= company.deliveryAddresses.length
      ) {
        throw new HttpException(
          'Invalid address index',
          HttpStatus.BAD_REQUEST,
        );
      }

      company.deliveryAddresses.splice(addressIndex, 1);
      await company.save();

      return company;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete delivery address',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProfile(companyId: string): Promise<Partial<Company>> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      return {
        companyName: company.companyName,
        companyAddress: company.companyAddress,
        companyMobile: company.companyMobile,
        taxId: company.taxId,
        founderName: company.founderName,
        websiteUrl: company.websiteUrl,
        role: company.role,
        tradeType: company.tradeType,
        mainLineBusiness: company.mainLineBusiness,
        // New fields
        bankInfo: company.bankInfo || {},
        tradeDetails: company.tradeDetails || {},
        whatsappContact: company.whatsappContact,
        primaryEmail: company.primaryEmail,
        alternativeSalesEmail: company.alternativeSalesEmail,
        // Settings page fields
        profilePicture: company.profilePicture,
        bannerImage: company.bannerImage,
        billingPreferences: company.billingPreferences || {
          useExistingEmail: true,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get company profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get public profile for a company (visible to other users)
   * Only returns non-sensitive fields (excludes bank info, KYC documents, billing preferences)
   * Validates that the company is a Seller or Both role before returning
   */
  async getPublicProfile(companyId: string): Promise<PublicCompanyProfileDto> {
    try {
      // Validate ObjectId format
      if (!Types.ObjectId.isValid(companyId)) {
        throw new HttpException(
          'Invalid company ID format',
          HttpStatus.BAD_REQUEST,
        );
      }

      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      // Only allow viewing seller or both role companies
      if (company.role !== Role.SELLER && company.role !== Role.BOTH) {
        throw new HttpException(
          'Company is not a seller',
          HttpStatus.FORBIDDEN,
        );
      }

      // Return only public-safe fields
      return {
        _id: companyId,
        companyName: company.companyName || '',
        companyAddress: company.companyAddress || '',
        companyMobile: company.companyMobile || '',
        taxId: company.taxId || '',
        founderName: company.founderName || '',
        websiteUrl: company.websiteUrl || '',
        role: company.role || '',
        tradeType: company.tradeType || '',
        mainLineBusiness: company.mainLineBusiness || [],
        whatsappContact: company.whatsappContact || '',
        primaryEmail: company.primaryEmail || '',
        alternativeSalesEmail: company.alternativeSalesEmail || '',
        profilePicture: company.profilePicture,
        bannerImage: company.bannerImage,
        isKycVerified: company.isKycVerified || false,
        tradeDetails: company.tradeDetails
          ? {
              emergingInterest: company.tradeDetails.emergingInterest,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get public company profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get public profile for a buyer company (used by sellers viewing buyer profiles)
   * Only allows viewing buyer or both role companies
   */
  async getBuyerPublicProfile(companyId: string): Promise<PublicCompanyProfileDto> {
    try {
      // Validate ObjectId format
      if (!Types.ObjectId.isValid(companyId)) {
        throw new HttpException(
          'Invalid company ID format',
          HttpStatus.BAD_REQUEST,
        );
      }

      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      // Only allow viewing buyer or both role companies
      if (company.role !== Role.BUYER && company.role !== Role.BOTH) {
        throw new HttpException(
          'Company is not a buyer',
          HttpStatus.FORBIDDEN,
        );
      }

      // Return only public-safe fields (no Products for buyers)
      return {
        _id: companyId,
        companyName: company.companyName || '',
        companyAddress: company.companyAddress || '',
        companyMobile: company.companyMobile || '',
        taxId: company.taxId || '',
        founderName: company.founderName || '',
        websiteUrl: company.websiteUrl || '',
        role: company.role || '',
        tradeType: company.tradeType || '',
        mainLineBusiness: company.mainLineBusiness || [],
        whatsappContact: company.whatsappContact || '',
        primaryEmail: company.primaryEmail || '',
        alternativeSalesEmail: company.alternativeSalesEmail || '',
        profilePicture: company.profilePicture,
        bannerImage: company.bannerImage,
        isKycVerified: company.isKycVerified || false,
        tradeDetails: company.tradeDetails
          ? {
              emergingInterest: company.tradeDetails.emergingInterest,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get buyer company profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateProfile(
    companyId: string,
    profileData: Partial<Company>,
  ): Promise<Partial<Company>> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      // Only allow updating specific fields
      const allowedFields = [
        'companyName',
        'companyAddress',
        'companyMobile',
        'taxId',
        'founderName',
        'websiteUrl',
        // New fields
        'bankInfo',
        'tradeDetails',
        'whatsappContact',
        'primaryEmail',
        'alternativeSalesEmail',
        // Settings page fields
        'billingPreferences',
      ];

      for (const field of allowedFields) {
        if (profileData[field] !== undefined) {
          company[field] = profileData[field];
        }
      }

      await company.save();

      return {
        companyName: company.companyName,
        companyAddress: company.companyAddress,
        companyMobile: company.companyMobile,
        taxId: company.taxId,
        founderName: company.founderName,
        websiteUrl: company.websiteUrl,
        role: company.role,
        tradeType: company.tradeType,
        mainLineBusiness: company.mainLineBusiness,
        // New fields
        bankInfo: company.bankInfo || {},
        tradeDetails: company.tradeDetails || {},
        whatsappContact: company.whatsappContact,
        primaryEmail: company.primaryEmail,
        alternativeSalesEmail: company.alternativeSalesEmail,
        // Settings page fields
        profilePicture: company.profilePicture,
        bannerImage: company.bannerImage,
        billingPreferences: company.billingPreferences || {
          useExistingEmail: true,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update company profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Profile Media Methods (Settings Page)

  async uploadProfilePicture(
    companyId: string,
    fileUrl: string,
  ): Promise<string> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      company.profilePicture = fileUrl;
      await company.save();

      return fileUrl;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to upload profile picture',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async uploadBanner(companyId: string, fileUrl: string): Promise<string> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      company.bannerImage = fileUrl;
      await company.save();

      return fileUrl;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to upload banner image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteProfilePicture(companyId: string): Promise<void> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      company.profilePicture = undefined;
      await company.save();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete profile picture',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteBanner(companyId: string): Promise<void> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      company.bannerImage = undefined;
      await company.save();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete banner image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // KYC Document Methods (Phase 4)

  /**
   * Check if company has a CIS document (any status)
   */
  async hasCisDocument(
    companyId: string,
  ): Promise<{ exists: boolean; document?: KycDocument }> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      const cisDoc = company.kycDocuments?.find(
        (doc) => doc.type === KycDocumentType.CIS,
      );
      return {
        exists: !!cisDoc,
        document: cisDoc,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to check CIS document status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if company can upload a new CIS document
   * - Returns true if no CIS exists
   * - Returns true if existing CIS is rejected (will auto-delete on upload)
   * - Returns false if CIS exists with pending/approved status
   */
  async canUploadCis(companyId: string): Promise<{
    canUpload: boolean;
    reason?: string;
    existingCisDocument?: { _id: string; status: string; uploadedAt: Date };
  }> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      const cisDoc = company.kycDocuments?.find(
        (doc) => doc.type === KycDocumentType.CIS,
      );

      if (!cisDoc) {
        return { canUpload: true };
      }

      // If CIS is rejected, allow re-upload (will auto-delete the rejected one)
      if (cisDoc.status === KycDocumentStatus.REJECTED) {
        return {
          canUpload: true,
          reason:
            'Your previous CIS was rejected. Uploading a new one will replace it.',
          existingCisDocument: {
            _id: cisDoc._id.toString(),
            status: cisDoc.status,
            uploadedAt: cisDoc.uploadedAt,
          },
        };
      }

      // CIS exists with pending or approved status
      return {
        canUpload: false,
        reason: `A CIS document already exists with status: ${cisDoc.status}. Delete the existing CIS first to upload a new one.`,
        existingCisDocument: {
          _id: cisDoc._id.toString(),
          status: cisDoc.status,
          uploadedAt: cisDoc.uploadedAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to check CIS upload eligibility',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get CIS status for the company (used by frontend to determine upload eligibility)
   */
  async getCisStatus(companyId: string): Promise<{
    hasCis: boolean;
    canUploadCis: boolean;
    reason?: string;
    existingCisDocument?: { _id: string; status: string; uploadedAt: Date };
  }> {
    const cisCheck = await this.hasCisDocument(companyId);
    const uploadCheck = await this.canUploadCis(companyId);

    return {
      hasCis: cisCheck.exists,
      canUploadCis: uploadCheck.canUpload,
      reason: uploadCheck.reason,
      existingCisDocument: uploadCheck.existingCisDocument,
    };
  }

  async getKycDocuments(companyId: string): Promise<KycDocument[]> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      return company.kycDocuments || [];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get KYC documents',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addKycDocument(
    companyId: string,
    documentData: {
      type: KycDocumentType;
      customName: string;
      description?: string; // Required for 'other' type
      filename: string;
      originalName: string;
      path: string;
      mimeType: string;
      size: number;
    },
  ): Promise<KycDocument> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      if (!company.kycDocuments) {
        company.kycDocuments = [];
      }

      // Validation based on document type
      if (documentData.type === KycDocumentType.CIS) {
        // Check CIS singleton rule
        const existingCis = company.kycDocuments.find(
          (doc) => doc.type === KycDocumentType.CIS,
        );
        if (existingCis) {
          if (existingCis.status === KycDocumentStatus.REJECTED) {
            // Auto-delete rejected CIS before adding new one
            company.kycDocuments = company.kycDocuments.filter(
              (doc) => doc._id.toString() !== existingCis._id.toString(),
            );
          } else {
            throw new HttpException(
              `A CIS document already exists with status: ${existingCis.status}. Delete the existing CIS first to upload a new one.`,
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      } else if (documentData.type === KycDocumentType.PRODUCT_CATALOG) {
        // Product Catalog requires CIS to exist first
        const hasCis = company.kycDocuments.some(
          (doc) => doc.type === KycDocumentType.CIS,
        );
        if (!hasCis) {
          throw new HttpException(
            'You must upload a CIS document before uploading a Product Catalog',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else if (documentData.type === KycDocumentType.OTHER) {
        // Other type requires description
        if (
          !documentData.description ||
          documentData.description.trim().length < 5
        ) {
          throw new HttpException(
            'Please provide a description for the document type (at least 5 characters)',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const newDocument: KycDocument = {
        _id: new Types.ObjectId(),
        type: documentData.type,
        customName: documentData.customName,
        description: documentData.description?.trim(),
        filename: documentData.filename,
        originalName: documentData.originalName,
        path: documentData.path,
        mimeType: documentData.mimeType,
        size: documentData.size,
        status: KycDocumentStatus.PENDING,
        uploadedAt: new Date(),
      };

      company.kycDocuments.push(newDocument);
      await company.save();

      return newDocument;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to add KYC document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteKycDocument(
    companyId: string,
    documentId: string,
  ): Promise<void> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      const docIndex = company.kycDocuments?.findIndex(
        (doc) => doc._id.toString() === documentId,
      );

      if (docIndex === undefined || docIndex === -1) {
        throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
      }

      const document = company.kycDocuments[docIndex];

      // CIS documents can be deleted regardless of status
      // This allows users to delete an approved CIS and upload a new one
      if (document.type === KycDocumentType.CIS) {
        company.kycDocuments.splice(docIndex, 1);
        await company.save();
        return;
      }

      // For non-CIS documents, only allow deletion of pending or rejected documents
      if (document.status === KycDocumentStatus.APPROVED) {
        throw new HttpException(
          'Cannot delete an approved document',
          HttpStatus.BAD_REQUEST,
        );
      }

      company.kycDocuments.splice(docIndex, 1);
      await company.save();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete KYC document',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getKycStatus(companyId: string): Promise<{
    isKycVerified: boolean;
    documents: KycDocument[];
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
  }> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      const documents = company.kycDocuments || [];
      const pendingCount = documents.filter(
        (d) => d.status === KycDocumentStatus.PENDING,
      ).length;
      const approvedCount = documents.filter(
        (d) => d.status === KycDocumentStatus.APPROVED,
      ).length;
      const rejectedCount = documents.filter(
        (d) => d.status === KycDocumentStatus.REJECTED,
      ).length;

      return {
        isKycVerified: company.isKycVerified || false,
        documents,
        pendingCount,
        approvedCount,
        rejectedCount,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get KYC status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
