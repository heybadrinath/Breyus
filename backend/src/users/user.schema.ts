import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, model, Types } from 'mongoose';


// FIXED: Role enum values now match Company schema (Bug #3 from audit)
// NOTE: User.role field is DEPRECATED - Company.role should be used for authorization
// The User.role field remains for backwards compatibility but may be removed in future
export enum Role {
  BUYER = 'Buyer',
  SELLER = 'Seller',
  BOTH = 'Seller and Buyer'
}

// Notification preferences interface
export interface NotificationPreferences {
  email: {
    tradeCreated: boolean;
    counterOffer: boolean;
    tradeAccepted: boolean;
    tradeRejected: boolean;
    documentUploaded: boolean;
    documentsInvalidated: boolean;
    phaseAdvanced: boolean;
    tradeCompleted: boolean;
    tradeCancelled: boolean;
  };
  realtime: {
    tradeCreated: boolean;
    counterOffer: boolean;
    tradeAccepted: boolean;
    tradeRejected: boolean;
    documentUploaded: boolean;
    documentsInvalidated: boolean;
    phaseAdvanced: boolean;
    tradeCompleted: boolean;
    tradeCancelled: boolean;
  };
}

// AI Buddy notification preferences interface (Settings Page)
export interface AINotificationPreferences {
  email?: string;
  useExistingEmail: boolean; // true = use user's mail for AI notifications
}

// Default notification preferences (all enabled)
export const defaultNotificationPreferences: NotificationPreferences = {
  email: {
    tradeCreated: true,
    counterOffer: true,
    tradeAccepted: true,
    tradeRejected: true,
    documentUploaded: true,
    documentsInvalidated: true,
    phaseAdvanced: true,
    tradeCompleted: true,
    tradeCancelled: true,
  },
  realtime: {
    tradeCreated: true,
    counterOffer: true,
    tradeAccepted: true,
    tradeRejected: true,
    documentUploaded: true,
    documentsInvalidated: true,
    phaseAdvanced: true,
    tradeCompleted: true,
    tradeCancelled: true,
  },
};

// Default AI notification preferences
export const defaultAINotificationPreferences: AINotificationPreferences = {
  useExistingEmail: true,
};

@Schema({ timestamps: true })
export class User extends Document {
  declare _id: Types.ObjectId;
  declare createdAt: Date;
  declare updatedAt: Date;

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

  // AI Buddy notification preferences (Settings Page)
  @Prop({ type: Object, default: defaultAINotificationPreferences })
  aiNotificationPreferences: AINotificationPreferences;

  // Suspension fields (Phase 3: User Management)
  @Prop({ type: Boolean, default: false })
  isSuspended: boolean;

  @Prop({ type: Date, default: null })
  suspendedAt?: Date | null;

  @Prop({ type: String, default: null })
  suspensionReason?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'AdminUser', default: null })
  suspendedBy?: Types.ObjectId | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add index for efficient suspended user queries
UserSchema.index({ isSuspended: 1 });
