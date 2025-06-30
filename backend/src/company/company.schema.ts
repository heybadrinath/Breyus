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

    @Prop()
    name: string;

    @Prop()
    location: string;

    @Prop()
    number: string;

    @Prop()
    taxId: string;

    @Prop()
    role: CompanyRole;

    @Prop()
    isVerified: boolean;

    @Prop()
    tradeType: TradeType;

    @Prop()
    founderName: string;

    @Prop()
    websiteUrl: string;

    @Prop()
    mainLineBusiness: string[];

    @Prop()
    meanMonthlyRevenue: MeanMonthlyRevenue;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: false })
    users: Types.ObjectId[]; // Or: User[]

    @Prop({ default: 0, required: false })
    onboardingProgress: number;

    @Prop({default: false, unique: false})
    isOnboardingCompleted: boolean;
}
export const CompanySchema = SchemaFactory.createForClass(Company)