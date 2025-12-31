import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, DeliveryAddress, BankInfo, TradeDetails } from './company.schema';

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
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('Failed to update company profile', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
} 