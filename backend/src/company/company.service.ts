import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, DeliveryAddress, BankInfo, TradeDetails, KycDocument, KycDocumentType, KycDocumentStatus, BillingPreferences } from './company.schema';

@Injectable()
export class CompanyService {
    constructor(
        @InjectModel(Company.name) private readonly companyModel: Model<Company>
    ) {}

    async addDeliveryAddress(companyId: string, address: DeliveryAddress): Promise<Company> {
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
            throw new HttpException('Failed to add delivery address', HttpStatus.INTERNAL_SERVER_ERROR);
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
            throw new HttpException('Failed to get delivery addresses', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateDeliveryAddress(companyId: string, addressIndex: number, address: DeliveryAddress): Promise<Company> {
        try {
            const company = await this.companyModel.findById(companyId);
            if (!company) {
                throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
            }

            if (addressIndex < 0 || addressIndex >= company.deliveryAddresses.length) {
                throw new HttpException('Invalid address index', HttpStatus.BAD_REQUEST);
            }

            company.deliveryAddresses[addressIndex] = address;
            await company.save();

            return company;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to update delivery address', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteDeliveryAddress(companyId: string, addressIndex: number): Promise<Company> {
        try {
            const company = await this.companyModel.findById(companyId);
            if (!company) {
                throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
            }

            if (addressIndex < 0 || addressIndex >= company.deliveryAddresses.length) {
                throw new HttpException('Invalid address index', HttpStatus.BAD_REQUEST);
            }

            company.deliveryAddresses.splice(addressIndex, 1);
            await company.save();

            return company;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to delete delivery address', HttpStatus.INTERNAL_SERVER_ERROR);
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
                billingPreferences: company.billingPreferences || { useExistingEmail: true },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to get company profile', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateProfile(companyId: string, profileData: Partial<Company>): Promise<Partial<Company>> {
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
                billingPreferences: company.billingPreferences || { useExistingEmail: true },
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to update company profile', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Profile Media Methods (Settings Page)

    async uploadProfilePicture(companyId: string, fileUrl: string): Promise<string> {
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
            throw new HttpException('Failed to upload profile picture', HttpStatus.INTERNAL_SERVER_ERROR);
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
            throw new HttpException('Failed to upload banner image', HttpStatus.INTERNAL_SERVER_ERROR);
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
            throw new HttpException('Failed to delete profile picture', HttpStatus.INTERNAL_SERVER_ERROR);
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
            throw new HttpException('Failed to delete banner image', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // KYC Document Methods (Phase 4)

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
            throw new HttpException('Failed to get KYC documents', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async addKycDocument(
        companyId: string,
        documentData: {
            type: KycDocumentType;
            customName: string;
            filename: string;
            originalName: string;
            path: string;
            mimeType: string;
            size: number;
        }
    ): Promise<KycDocument> {
        try {
            const company = await this.companyModel.findById(companyId);
            if (!company) {
                throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
            }

            const newDocument: KycDocument = {
                _id: new Types.ObjectId(),
                type: documentData.type,
                customName: documentData.customName,
                filename: documentData.filename,
                originalName: documentData.originalName,
                path: documentData.path,
                mimeType: documentData.mimeType,
                size: documentData.size,
                status: KycDocumentStatus.PENDING,
                uploadedAt: new Date(),
            };

            if (!company.kycDocuments) {
                company.kycDocuments = [];
            }
            company.kycDocuments.push(newDocument);
            await company.save();

            return newDocument;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to add KYC document', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteKycDocument(companyId: string, documentId: string): Promise<void> {
        try {
            const company = await this.companyModel.findById(companyId);
            if (!company) {
                throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
            }

            const docIndex = company.kycDocuments?.findIndex(
                (doc) => doc._id.toString() === documentId
            );

            if (docIndex === undefined || docIndex === -1) {
                throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
            }

            const document = company.kycDocuments[docIndex];

            // Only allow deletion of pending or rejected documents
            if (document.status === KycDocumentStatus.APPROVED) {
                throw new HttpException(
                    'Cannot delete an approved document',
                    HttpStatus.BAD_REQUEST
                );
            }

            company.kycDocuments.splice(docIndex, 1);
            await company.save();
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to delete KYC document', HttpStatus.INTERNAL_SERVER_ERROR);
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
            const pendingCount = documents.filter(d => d.status === KycDocumentStatus.PENDING).length;
            const approvedCount = documents.filter(d => d.status === KycDocumentStatus.APPROVED).length;
            const rejectedCount = documents.filter(d => d.status === KycDocumentStatus.REJECTED).length;

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
            throw new HttpException('Failed to get KYC status', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
} 