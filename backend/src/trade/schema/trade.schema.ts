import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


// Define all possible Incoterms
type IncotermType = 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';

// Define the structure for each Incoterm row (e.g., Insurance, Carriage Charges)
type IncotermRowData = Record<string, 'Buyer' | 'Seller'>;

// Define the structure for Incoterms (selected and defaults)
interface Incoterms {
    selectedIncotermData?: IncotermRowData;  // Data for selected Incoterm
    defaults?: Record<IncotermType, IncotermRowData>;  // Default Incoterm values
}

// Product Schema definition
@Schema()
export class Product extends Document {

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    product: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    Buyer: Types.ObjectId;

    @Prop()
    tradeStatus: string;

    @Prop({ required: true })
    quantity: string;

    @Prop({ required: true })
    quantityUnit: string;

    // Counter Offer (Buyer)

    @Prop()
    buyerOfferedPrice: string;

    @Prop()
    buyerIncoterms: Incoterms;

    @Prop()
    buyerMessage: string;

    // Recountered by (seller)
    @Prop()
    sellerOfferedPrice: string;

    @Prop()
    sellerOfferedIncoterms: Incoterms;

    // Trade Queries
    @Prop()
    buyerIndustryType: string;

    @Prop({ required: true })
    buyerMarketYears: string;

    @Prop()
    marketCapture: string;

    @Prop({ required: true })
    tradeYears: string;

    @Prop()
    productUsage: string;

    // Payment Type
    




    // Timestamps
    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}


export const ProductSchema = SchemaFactory.createForClass(Product);
