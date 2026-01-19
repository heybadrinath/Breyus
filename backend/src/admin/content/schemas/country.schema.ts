import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Country extends Document {
  @Prop({ required: true, unique: true })
  isoCode: string; // ISO 3166-1 alpha-2: "US", "IN", "DE"

  @Prop({ required: true, unique: true })
  isoCode3: string; // ISO 3166-1 alpha-3: "USA", "IND", "DEU"

  @Prop({ required: true })
  name: string;

  @Prop()
  flagEmoji?: string; // "🇺🇸", "🇮🇳"

  @Prop({
    required: true,
    enum: [
      'Africa',
      'Asia',
      'Europe',
      'North America',
      'South America',
      'Oceania',
      'Antarctica',
    ],
  })
  continent: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const CountrySchema = SchemaFactory.createForClass(Country);

// Add indexes for common queries
CountrySchema.index({ isoCode: 1 });
CountrySchema.index({ name: 1 });
CountrySchema.index({ continent: 1 });
CountrySchema.index({ isActive: 1 });
