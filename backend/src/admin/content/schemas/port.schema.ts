import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Port extends Document {
  declare _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  code: string; // UN/LOCODE: "USNYC", "INBOM", "DEHAM"

  @Prop({ type: Types.ObjectId, ref: 'Country', required: true })
  country: Types.ObjectId;

  @Prop({ required: true, enum: ['sea', 'air', 'land'] })
  type: string;

  @Prop()
  city?: string;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const PortSchema = SchemaFactory.createForClass(Port);

// Add indexes for common queries
PortSchema.index({ code: 1 });
PortSchema.index({ country: 1 });
PortSchema.index({ type: 1 });
PortSchema.index({ isActive: 1 });
PortSchema.index({ name: 'text', city: 'text' }); // Text search
