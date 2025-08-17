import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MeanMonthlyRevenue } from 'src/onboarding/dto/onboarding.dto';

export enum Role {
    BUYER = 'Buyer',
    SELLER = 'Seller',
    BOTH = 'Seller and Buyer'
}

export enum TradeType {
    INTERNATIONAL = 'international',
    DOMESTIC = 'domestic',
}

// Address interface for delivery addresses
export interface DeliveryAddress {
    fullName: string;
    mobileNumber: string;
    pincode: string;
    streetName: string;
    landmark?: string;
    city: string;
    state: string;
    country: string;
    additionalDetails?: string;
}

@Schema({ timestamps: true })
export class Company extends Document {

    @Prop()
    companyName: string;

    @Prop()
    companyAddress: string;

    @Prop()
    companyMobile: string;

    @Prop()
    taxId: string;

    @Prop()
    role: Role;

    @Prop()
    isVerified: boolean;

    @Prop()
    tradeType: TradeType;

    @Prop()
    founderName: string;

    @Prop()
    websiteUrl: string;

    @Prop()
    exportedBefore: boolean;

    @Prop()
    referrel: string;

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

    @Prop({ type: [Object], default: [] })
    deliveryAddresses: DeliveryAddress[];
}
export const CompanySchema = SchemaFactory.createForClass(Company)