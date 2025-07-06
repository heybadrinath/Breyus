import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


@Schema({collection: 'hsn_codes'})
export class HSN extends Document {

    @Prop()
    hsn_code: string;

    @Prop()
    description: string;

    @Prop()
    category: string;
    
}
export const HSNSchema = SchemaFactory.createForClass(HSN)