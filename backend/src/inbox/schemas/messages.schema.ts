import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ required: true })
  content: string;  // Text content of the message

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  sender: MongooseSchema.Types.ObjectId;  // Reference to Company

  @Prop({ default: Date.now })
  timestamp: Date;  

  @Prop({ type: [Object], default: [] })
  attachments: { 
    filePath: string;  // Path to the stored file
    fileName: string;  // Original file name
    mimeType: string;  // MIME type of the file
  }[];  // Array of attachments
}

export const MessageSchema = SchemaFactory.createForClass(Message);
