import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Message } from './messages.schema';

@Schema({ timestamps: true })
export class Conversation extends Document {
  @Prop({ required: true, type: [MongooseSchema.Types.ObjectId], ref: 'Company' })
  participants: MongooseSchema.Types.ObjectId[];
  @Prop({ required: true, type: [MongooseSchema.Types.ObjectId], ref: 'Product' })
  product: MongooseSchema.Types.ObjectId;    

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Message' }] })
  messages: MongooseSchema.Types.ObjectId[];  // Array of Message references

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
