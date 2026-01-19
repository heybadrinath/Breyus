import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminRole = 'super_admin' | 'admin' | 'viewer';

@Schema({ timestamps: true, collection: 'adminusers' })
export class AdminUser extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: ['super_admin', 'admin', 'viewer'],
    default: 'admin'
  })
  role: AdminRole;

  @Prop({ type: Date })
  lastLogin: Date;

  @Prop({ type: Number, default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date })
  lockUntil: Date;

  // Timestamps added automatically by { timestamps: true }
  createdAt: Date;
  updatedAt: Date;
}

export const AdminUserSchema = SchemaFactory.createForClass(AdminUser);

// Create indexes
AdminUserSchema.index({ email: 1 }, { unique: true });
