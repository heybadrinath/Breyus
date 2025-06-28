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

    @Prop({ unique: true })
    name: string;

    @Prop({ unique: false })
    location: string;

    @Prop({ unique: true })
    number: string;

    @Prop({ unique: true })
    taxId: string;

    @Prop({ unique: false })
    role: CompanyRole;

    @Prop({ unique: false })
    isVerified: boolean;

    @Prop({ unique: false })
    tradeType: TradeType;

    @Prop({ unique: true })
    founderName: string;

    @Prop({ unique: true })
    websiteUrl: string;

    @Prop()
    mainLineBusiness: string[];

    @Prop()
    meanMonthlyRevenue: MeanMonthlyRevenue;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
    users: Types.ObjectId[]; // Or: User[]

    @Prop({ default: 0 })
    onboardingProgress: number;

    @Prop({default: false})
    isOnboardingCompleted: boolean;
}
export const CompanySchema = SchemaFactory.createForClass(Company)