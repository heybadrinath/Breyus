import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { prop } from '@typegoose/typegoose';
import { Document, Types } from 'mongoose';
import { MeanMonthlyRevenue } from 'src/onboarding/dto/onboarding.dto';

export enum CompanyRole {
    SELLER = 'seller',
    BUYER = 'buyer'
}

export enum TradeType {
    INTERNATIONAL = 'international',
    DOMESTIC = 'domestic',
}


@Schema({ timestamps: true })
export class Company extends Document {

    @Prop({ unique: true, required: false, default: '__UNIQUE__PLACEHOLDER__' })
    name: string;

    @Prop({ unique: false, required: false })
    location: string;

    @Prop({ unique: true, required: false, default: '__UNIQUE__PLACEHOLDER__' })
    number: string;

    @Prop({ unique: true, required: false, default: '__UNIQUE__PLACEHOLDER__' })
    taxId: string;

    @Prop({ unique: false, required: false })
    role: CompanyRole;

    @Prop({ unique: false, default: false })
    isVerified: boolean;

    @Prop({ unique: false, required: false })
    tradeType: TradeType;

    @Prop({ unique: false, required: false })
    founderName: string;

    @Prop({ unique: true, required: false, default: '__UNIQUE__PLACEHOLDER__' })
    websiteUrl: string;

    @Prop({required: false})
    mainLineBusiness: string[];

    @Prop({required: false})
    meanMonthlyRevenue: MeanMonthlyRevenue;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: false })
    users: Types.ObjectId[]; // Or: User[]

    @Prop({ default: 0, required: false })
    onboardingProgress: number;

    @Prop({default: false})
    isOnboardingCompleted: boolean;
}
export const CompanySchema = SchemaFactory.createForClass(Company)