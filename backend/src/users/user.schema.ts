import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, model, Types } from 'mongoose';


export enum Role {
  Buyer = 'admin',
  Seller = 'user',
}

@Schema({ timestamps: true })
export class User extends Document {

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
}

export const UserSchema = SchemaFactory.createForClass(User);
