import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ required: true })
  text: string;  // Text content of the message

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  sender: Types.ObjectId;  // Reference to Company

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  receiver: Types.ObjectId;  // Reference to Company

  @Prop({ type: [Types.ObjectId], ref: 'Company', default: [], index: true })
  readBy: Types.ObjectId[]; // Companies who have read this message

  @Prop({ type: Types.ObjectId, ref: 'Message', default: null })
  replyTo?: Types.ObjectId;

  @Prop({
    type: [
      {
        user: { type: Types.ObjectId, ref: 'Company' },
        emoji: { type: String },
        reactedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  reactions: {
    user: Types.ObjectId;
    emoji: string;
    reactedAt: Date;
  }[];

  @Prop({ type: Date, default: null })
  editedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Company', default: null })
  editedBy?: Types.ObjectId;

  @Prop({ type: [Object], default: [] })
  attachments: {
    filePath: string;  // Path to the stored file
    fileName: string;  // Original file name
    mimeType: string;  // MIME type of the file
  }[];  // Array of attachments

  // Soft-delete tracking (Bug #6: Cascade Deletes)
  @Prop({ type: Boolean, default: false })
  senderDeleted: boolean;  // True if sender company was deleted

  @Prop({ type: Date })
  senderDeletedAt?: Date;  // When the sender company was deleted

  @Prop({ type: Boolean, default: false })
  receiverDeleted: boolean;  // True if receiver company was deleted

  @Prop({ type: Date })
  receiverDeletedAt?: Date;  // When the receiver company was deleted
}

export const MessageSchema = SchemaFactory.createForClass(Message);
