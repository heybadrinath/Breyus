import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MeanMonthlyRevenue } from 'src/onboarding/dto/onboarding.dto';

export enum Role {
    BUYER = 'Buyer',
    SELLER = 'Seller',
    BOTH = 'Seller and Buyer'
}

export enum TradeType {
    INTERNATIONAL = 'international',
    DOMESTIC = 'domestic',
}

// KYC Document Types (Phase 4)
export enum KycDocumentType {
    CIS = 'cis',
    PASSPORT = 'passport',
    TAX_CERTIFICATE = 'tax_certificate',
    BUSINESS_REGISTRATION = 'business_registration',
    OTHER = 'other',
}

// KYC Document Status (Phase 4)
export enum KycDocumentStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

// KYC Document interface for embedded documents (Phase 4)
export interface KycDocument {
    _id: Types.ObjectId;
    type: KycDocumentType;
    customName: string;           // User-provided name
    filename: string;
    originalName: string;
    path: string;
    mimeType: string;
    size: number;
    status: KycDocumentStatus;    // default: 'pending'
    uploadedAt: Date;
    reviewedBy?: Types.ObjectId;  // AdminUser who reviewed
    reviewedAt?: Date;
    reviewNotes?: string;         // Admin notes (visible to user)
}

// Address interface for delivery addresses
export interface DeliveryAddress {
    fullName: string;
    mobileNumber: string;
    pincode: string;
    streetName: string;
    landmark?: string;
    city: string;
    state: string;
    country: string;
    additionalDetails?: string;
}

// Bank Information interface
export interface BankInfo {
    ifscCode?: string;
    accountNumber?: string;
    accountHolderName?: string;
    bankAddress?: string;
    bankBranch?: string;
}

// Trade Details interface
export interface TradeDetails {
    emergingInterest?: string;
    agreedToTerms?: boolean;
    cisDocument?: string; // URL to uploaded CIS file
}

// Billing Preferences interface (Settings Page)
export interface BillingPreferences {
    invoiceEmail?: string;
    useExistingEmail?: boolean; // true = use primaryEmail for invoices
}

@Schema({ timestamps: true })
export class Company extends Document {

    @Prop()
    companyName: string;

    @Prop()
    companyAddress: string;

    @Prop()
    companyMobile: string;

    // FIXED: Added unique constraint (Audit Bug #4 - Missing unique constraints)
    // sparse: true allows null values but enforces uniqueness when present
    @Prop({ unique: true, sparse: true })
    taxId: string;

    @Prop()
    role: Role;

    @Prop()
    isVerified: boolean;

    @Prop()
    tradeType: TradeType;

    @Prop()
    founderName: string;

    @Prop()
    websiteUrl: string;

    @Prop()
    exportedBefore: boolean;

    @Prop()
    referrel: string;

    @Prop()
    mainLineBusiness: string[];

    @Prop()
    meanMonthlyRevenue: MeanMonthlyRevenue;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: false })
    users: Types.ObjectId[]; // Or: User[]

    @Prop({ default: 0, required: false })
    onboardingProgress: number;

    @Prop({default: false, unique: false})
    isOnboardingCompleted: boolean;

    @Prop({ type: [Object], default: [] })
    deliveryAddresses: DeliveryAddress[];

    // Bank Information
    @Prop({ type: Object, default: {} })
    bankInfo: BankInfo;

    // Trade Details
    @Prop({ type: Object, default: {} })
    tradeDetails: TradeDetails;

    // Contact Information
    @Prop()
    whatsappContact: string;

    // FIXED: Added unique constraint with normalization (Audit Bug #4)
    @Prop({ unique: true, sparse: true, lowercase: true, trim: true })
    primaryEmail: string;

    @Prop()
    alternativeSalesEmail: string;

    // KYC Documents (Phase 4)
    @Prop({ type: [Object], default: [] })
    kycDocuments: KycDocument[];

    // Company-level KYC verification (Phase 4)
    @Prop({ type: Boolean, default: false })
    isKycVerified: boolean;

    @Prop({ type: Types.ObjectId, ref: 'AdminUser' })
    kycVerifiedBy?: Types.ObjectId;

    @Prop({ type: Date })
    kycVerifiedAt?: Date;

    @Prop({ type: String })
    kycVerificationNotes?: string;

    // Profile Media (Settings Page)
    @Prop({ type: String })
    profilePicture?: string;

    @Prop({ type: String })
    bannerImage?: string;

    // Billing Preferences (Settings Page)
    @Prop({ type: Object, default: { useExistingEmail: true } })
    billingPreferences: BillingPreferences;

    // Currency for analytics display (ISO 4217)
    @Prop({ type: String, default: 'USD' })
    currency: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

// Add indexes for KYC queries
CompanySchema.index({ isKycVerified: 1 });
CompanySchema.index({ 'kycDocuments.status': 1 });