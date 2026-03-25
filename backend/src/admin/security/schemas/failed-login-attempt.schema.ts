import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum FailedLoginReason {
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_SUSPENDED = 'USER_SUSPENDED',
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_INVALID = 'OTP_INVALID',
  IP_BLOCKED = 'IP_BLOCKED',
}

@Schema({ timestamps: true, collection: 'failedloginattempts' })
export class FailedLoginAttempt extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  ipAddress: string;

  @Prop()
  userAgent?: string;

  @Prop({ required: true })
  attemptedAt: Date;

  @Prop({ required: true, enum: FailedLoginReason })
  reason: FailedLoginReason;

  createdAt: Date;
  updatedAt: Date;
}

export const FailedLoginAttemptSchema =
  SchemaFactory.createForClass(FailedLoginAttempt);

// Create indexes
FailedLoginAttemptSchema.index({ email: 1 });
FailedLoginAttemptSchema.index({ ipAddress: 1 });
FailedLoginAttemptSchema.index({ attemptedAt: -1 });
FailedLoginAttemptSchema.index({ reason: 1 });

// TTL index - auto-delete records after 30 days
FailedLoginAttemptSchema.index(
  { attemptedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
);
