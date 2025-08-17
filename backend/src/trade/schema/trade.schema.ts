import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Define all possible Incoterms
type IncotermType = 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';

// Define the structure for each Incoterm row (e.g., Insurance, Carriage Charges)
type IncotermRowData = Record<string, 'Buyer' | 'Seller'>;

// Define the structure for Incoterms (selected and defaults)
interface Incoterms {
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
    tradeStatus: string;

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

    // Timestamps
    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
