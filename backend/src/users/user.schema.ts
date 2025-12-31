import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, model, Types } from 'mongoose';


export enum Role {
  Buyer = 'admin',
  Seller = 'user',
}

// Notification preferences interface
export interface NotificationPreferences {
  email: {
    counterOffer: boolean;
    tradeAccepted: boolean;
    tradeRejected: boolean;
    documentUploaded: boolean;
    phaseAdvanced: boolean;
    tradeCompleted: boolean;
  };
  realtime: {
    counterOffer: boolean;
    tradeAccepted: boolean;
    tradeRejected: boolean;
    documentUploaded: boolean;
    phaseAdvanced: boolean;
    tradeCompleted: boolean;
  };
}

// Default notification preferences (all enabled)
export const defaultNotificationPreferences: NotificationPreferences = {
  email: {
    counterOffer: true,
    tradeAccepted: true,
    tradeRejected: true,
    documentUploaded: true,
    phaseAdvanced: true,
    tradeCompleted: true,
  },
  realtime: {
    counterOffer: true,
    tradeAccepted: true,
    tradeRejected: true,
    documentUploaded: true,
    phaseAdvanced: true,
    tradeCompleted: true,
  },
};

@Schema({ timestamps: true })
export class User extends Document {
  declare _id: Types.ObjectId;

  @Prop({ unique: true })
  mail: string;

  @Prop()
  password: string;

  @Prop()
  role: Role;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId;

  @Prop({ default: 0 })
  failedLoginAttempts?: number;

  @Prop({ type: Number, default: null })
  lockUntil?: number | null;

  @Prop({ type: String, default: null })
  passwordResetToken?: string | null;

  @Prop({ type: Date, default: null })
  passwordResetExpires?: Date | null;

  @Prop({ type: Object, default: defaultNotificationPreferences })
  notificationPreferences: NotificationPreferences;
}

export const UserSchema = SchemaFactory.createForClass(User);
