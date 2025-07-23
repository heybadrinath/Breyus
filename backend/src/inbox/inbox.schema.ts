import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/user.schema';  
import { Product } from 'src/products/schema/products.schema';  

@Schema({ timestamps: true })
export class Inbox extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;  

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipient: Types.ObjectId; 

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId; 

  @Prop({ required: true })
  content: string;  

  @Prop({ default: false })
  isRead: boolean;  

  @Prop({ default: Date.now })
  timestamp: Date;  

  
  @Prop({ 
    type: [
      {
        fileUrl: { type: String, required: true }, 
        fileName: { type: String, required: true }, 
        fileType: { type: String, required: true },  
        fileSize: { type: Number, required: true },  
        uploadedAt: { type: Date, default: Date.now }, 
      }
    ], 
    default: []
  })
  attachments: Array<{
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
}

export const InboxSchema = SchemaFactory.createForClass(Inbox);
