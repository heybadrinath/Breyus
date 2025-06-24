import {prop} from "@typegoose/typegoose";
import {IsString, IsOptional, IsBoolean, IsEnum} from "class-validator";
import {Ref} from "@typegoose/typegoose";
import {User} from "./users.schema";

enum Role {
  Seller = 'seller',
  Buyer = 'buyer',
  Both = 'both',
}
enum TradeType {
  International = 'international',
  Domestic = 'domestic',
}

export class CompanyDetails {
    @prop({ required: true, unique: true })
    @IsString()
    companyName: string;

    @prop({ required: true, unique: false})
    @IsString()
    companyLocation: string;

    @prop({ required: true, unique: true })
    @IsString()
    companyPhone: string;

    @prop({ required: true, unique: true })
    @IsString()
    taxId: string;

    @prop({ required: true })
    @IsEnum(Role)
    role: Role;

    @prop({ default: false })
    @IsBoolean()
    isVerified?: boolean;

    @prop({required: true})
    @IsEnum(TradeType)
    tradeType: TradeType;

    @prop({ required: true})
    @IsString()
    companyFounder: string;

    @prop({ required: false })
    @IsString()
    @IsOptional()
    companyWebsiteUri?: string;

    @prop({ref: () => User, required: true})
    users: Ref<User>[];
}