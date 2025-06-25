import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// import { UserSchema } from 'src/users/user.schema';

export enum CompanyRole {
    ADMIN = 'admin',
    USER = 'user',
}

export enum TradeType {
    INTERNATIONAL = 'international',
    DOMESTIC = 'domestic',
}


@Schema({ timestamps: true })
export class Company extends Document {

    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true, unique: false })
    location: string;

    @Prop({ required: true, unique: true })
    number: string;

    @Prop({ required: true, unique: true })
    taxId: string;

    @Prop({ required: true, unique: false })
    role: CompanyRole;

    @Prop({ required: true, unique: false })
    isVerified: boolean;

    @Prop({ required: true, unique: false })
    tradeType: TradeType;

    @Prop({ required: true, unique: true })
    founderName: string;

    @Prop({ required: true, unique: true })
    websiteUrl: string;

    // @Prop({ type: Types.ObjectId, ref: 'UserSchema' })
    // author: UserSchema;
}