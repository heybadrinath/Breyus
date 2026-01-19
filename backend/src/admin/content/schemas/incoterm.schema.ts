import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Cost allocation interface - who pays for what
export interface CostAllocation {
  commercialInvoice: 'Buyer' | 'Seller';
  packagingQualityControl: 'Buyer' | 'Seller';
  loadingInlandDelivery: 'Buyer' | 'Seller';
  exportDutyTaxes: 'Buyer' | 'Seller';
  originTerminalHandling: 'Buyer' | 'Seller';
  insurance: 'Buyer' | 'Seller';
  carriageCharges: 'Buyer' | 'Seller';
  destinationTerminalHandling: 'Buyer' | 'Seller';
  deliveryToDestination: 'Buyer' | 'Seller';
  unloadingAtDestination: 'Buyer' | 'Seller';
  importDutyTaxes: 'Buyer' | 'Seller';
}

@Schema({ timestamps: true })
export class Incoterm extends Document {
  @Prop({
    required: true,
    unique: true,
    enum: [
      'EXW',
      'FCA',
      'FAS',
      'FOB',
      'CFR',
      'CIF',
      'CPT',
      'CIP',
      'DAP',
      'DPU',
      'DDP',
    ],
  })
  code: string;

  @Prop({ required: true })
  name: string; // "Ex Works", "Free Carrier", etc.

  @Prop({ required: true })
  description: string; // Full text description

  @Prop()
  riskTransferDescription?: string; // When risk transfers from seller to buyer

  @Prop({ required: true, enum: ['any', 'sea_inland'] })
  transportMode: string; // 'any' = all transport modes, 'sea_inland' = sea/inland only

  @Prop({ type: Object, required: true })
  costAllocation: CostAllocation;

  createdAt: Date;
  updatedAt: Date;
}

export const IncotermSchema = SchemaFactory.createForClass(Incoterm);

// Add index
IncotermSchema.index({ code: 1 });
