import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Currency extends Document {
  @Prop({ required: true, unique: true })
  code: string; // ISO 4217: "USD", "EUR", "INR"

  @Prop({ required: true })
  name: string; // "US Dollar", "Euro"

  @Prop({ required: true })
  symbol: string; // "$", "€", "₹"

  @Prop({ required: true, enum: ['before', 'after'], default: 'before' })
  symbolPosition: string; // before: $100, after: 100€

  @Prop({ default: 2 })
  decimalPlaces: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);

// Add indexes for common queries
CurrencySchema.index({ code: 1 });
CurrencySchema.index({ isActive: 1 });
