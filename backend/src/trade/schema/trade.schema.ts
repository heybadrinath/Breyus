import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Define all possible Incoterms
type IncotermType = 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';

// Define the structure for each Incoterm row (e.g., Insurance, Carriage Charges)
type IncotermRowData = Record<string, 'Buyer' | 'Seller'>;

// Define the structure for Incoterms (selected and defaults)
export interface Incoterms {
    selectedIncoterm?: IncotermType;
    selectedIncotermData?: IncotermRowData;  // Data for selected Incoterm
    defaults?: Record<IncotermType, IncotermRowData>;  // Default Incoterm values
}

// Address interface
interface Address {
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

// Payment method interface
interface PaymentMethod {
    type: 'advance' | 'credit' | 'openAccount';
    method: 'RTGS' | 'LetterOfCredit';
    percentage?: string;
    days?: string;
}

// Negotiation history entry interface
export interface NegotiationEntry {
    round: number;
    party: 'buyer' | 'seller';
    offeredPrice?: string;
    offeredIncoterms?: Incoterms;
    message?: string;
    timestamp: Date;
}

// Negotiation status type
type NegotiationStatus = 'pending' | 'countered' | 'buyer_responded' | 'accepted' | 'rejected' | 'cancelled';

// Trade phase type - represents the current stage in the trade lifecycle
export type TradePhase = 'PR' | 'SCO' | 'ICPO' | 'SPA' | 'PAYMENT' | 'BOL' | 'COMPLETED' | 'CANCELLED';

// Document status type - tracks the state of each document
export type DocumentStatus = 'pending' | 'uploaded' | 'approved' | 'rejected';

// Document version interface - stores metadata for a specific version
export interface DocumentVersion {
    filePath: string;           // Storage path/URL of the document
    originalName: string;       // Original filename
    mimeType: string;           // File MIME type
    size: number;               // File size in bytes
    uploadedAt: Date;           // Upload timestamp
    uploadedBy: Types.ObjectId; // User who uploaded
    version: number;            // Version number (1, 2, 3, etc.)
}

// Document info interface - stores metadata for uploaded documents with versioning
export interface DocumentInfo {
    filePath: string;           // Storage path/URL of the current document
    originalName: string;       // Original filename
    mimeType: string;           // File MIME type
    size: number;               // File size in bytes
    uploadedAt: Date;           // Upload timestamp
    uploadedBy: Types.ObjectId; // User who uploaded
    status: DocumentStatus;     // Document verification status
    notes?: string;             // Optional notes about the document
    // Signature fields (for single-signer documents like SCO, ICPO, BoL)
    signatureDataUrl?: string;  // Base64 PNG data URL of the signature
    signedAt?: Date;            // When the document was signed
    signedBy?: Types.ObjectId;  // User who signed
    // Version tracking
    version?: number;           // Current version number (defaults to 1)
    history?: DocumentVersion[]; // Previous versions of this document
}

// SPA Document info - extends DocumentInfo with dual signature support
export interface SPADocumentInfo extends DocumentInfo {
    // Seller signature (Pre-SPA)
    sellerSignatureDataUrl?: string;
    sellerSignedAt?: Date;
    sellerSignedBy?: Types.ObjectId;
    // Buyer signature (Re-SPA / counter-sign)
    buyerSignatureDataUrl?: string;
    buyerSignedAt?: Date;
    buyerSignedBy?: Types.ObjectId;
}

// Trade Schema definition
@Schema({ timestamps: true })
export class Trade extends Document {

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    product: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    buyer: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    seller: Types.ObjectId;

    @Prop({ default: 'pending' })
    purchaseRequestStatus: string;

     @Prop({ default: 'pending' })
    purchaseOrderStatus: string;

    @Prop({ required: true })
    quantity: string;

    @Prop({ required: true })
    quantityUnit: string;

    // Step 1: Negotiation (Optional/Skippable)
    @Prop()
    buyerOfferedPrice?: string;

    @Prop({ type: Object })
    buyerIncoterms?: Incoterms;

    @Prop()
    buyerMessage?: string;

    // Step 2: Address

    @Prop({ type: Object, required: true })
    selectedAddress: Address;

    // Step 3: Trade Queries
    @Prop()
    buyerIndustryType?: string;

    @Prop({ required: true })
    buyerMarketYears: string;

    @Prop()
    marketCapture?: string;

    @Prop({ required: true })
    tradeYears: string;

    @Prop()
    productUsage?: string;

    // Step 4: Payment
    @Prop({ type: Object, required: true })
    paymentMethod: PaymentMethod;

    // Seller Response (for future use)
    @Prop()
    sellerOfferedPrice?: string;

    @Prop({ type: Object })
    sellerOfferedIncoterms?: Incoterms;

    @Prop()
    sellerMessage?: string;

    // Negotiation tracking
    @Prop({ type: String, default: 'pending' })
    negotiationStatus: NegotiationStatus;

    @Prop({ type: Number, default: 0 })
    currentNegotiationRound: number;

    @Prop({ type: [Object], default: [] })
    negotiationHistory: NegotiationEntry[];

    @Prop()
    rejectionReason?: string;

    @Prop()
    acceptedAt?: Date;

    @Prop()
    rejectedAt?: Date;

    // ========================
    // PHASE 2: Trade Phase & Document Management
    // ========================

    // Current trade phase in the lifecycle
    @Prop({
        type: String,
        enum: ['PR', 'SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL', 'COMPLETED', 'CANCELLED'],
        default: 'PR'
    })
    tradePhase: TradePhase;

    // SCO (Soft Corporate Offer) - Uploaded by Seller
    @Prop({ type: Object })
    scoDocument?: DocumentInfo;

    // ICPO (Irrevocable Corporate Purchase Order) - Uploaded by Buyer
    @Prop({ type: Object })
    icpoDocument?: DocumentInfo;

    // SPA (Sales Purchase Agreement) - Requires BOTH parties to sign
    // Flow: Seller uploads (Pre-SPA) → Buyer signs (Re-SPA) → Advance to Payment
    @Prop({ type: Object })
    spaDocument?: SPADocumentInfo;

    // BoL (Bill of Lading) - Uploaded by Seller
    @Prop({ type: Object })
    bolDocument?: DocumentInfo;

    // Payment Proof - Uploaded by Buyer
    @Prop({ type: Object })
    paymentProof?: DocumentInfo;

    // Phase Timestamps - Track when each phase was reached
    @Prop()
    scoSubmittedAt?: Date;

    @Prop()
    icpoSubmittedAt?: Date;

    @Prop()
    spaUploadedAt?: Date;  // When SPA was uploaded (by seller)

    @Prop()
    spaSellerSignedAt?: Date;  // When seller signed the SPA

    @Prop()
    spaBuyerSignedAt?: Date;  // When buyer counter-signed the SPA

    @Prop()
    paymentVerifiedAt?: Date;

    @Prop()
    bolUploadedAt?: Date;

    @Prop()
    completedAt?: Date;

    // ========================
    // CANCELLATION TRACKING
    // ========================

    // When the trade was cancelled
    @Prop()
    cancelledAt?: Date;

    // Who cancelled the trade
    @Prop({ type: Types.ObjectId, ref: 'User' })
    cancelledBy?: Types.ObjectId;

    // Reason for cancellation
    @Prop()
    cancellationReason?: string;

    // ========================
    // NOTIFICATION BADGE TRACKING
    // ========================

    // Tracks if the buyer has unread updates on this trade
    @Prop({ default: false })
    buyerHasUnread: boolean;

    // Tracks if the seller has unread updates on this trade
    @Prop({ default: false })
    sellerHasUnread: boolean;

    // Last time buyer viewed this trade
    @Prop()
    lastBuyerViewedAt?: Date;

    // Last time seller viewed this trade
    @Prop()
    lastSellerViewedAt?: Date;

    // Timestamps
    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
