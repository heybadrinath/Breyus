import { prop } from "@typegoose/typegoose";
import { IsString,IsOptional,IsInt,IsDecimal,IsBoolean } from "class-validator";
import { Ref } from "@typegoose/typegoose";
import { CompanyDetails } from "./company.details.schema";

export class User {

    @prop({ required: true })
    @IsString()
    email: string;

    @prop({ required: true })
    @IsString()
    password: string;

    @prop({ ref: () => CompanyDetails, required: true })
    companyDetails: Ref<CompanyDetails>;

    
}