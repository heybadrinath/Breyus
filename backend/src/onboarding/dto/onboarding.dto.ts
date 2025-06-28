import { IsEmail, IsString, IsNotEmpty, IsBoolean, IsEnum, IsArray, ArrayNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class Step1Dto {

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase() : value)
    name: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsEmail()
    @IsNotEmpty()
    @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase() : value)
    mail: string;

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value.replace(/\s+/g, ''))
    @Matches(/^\+(\d{1,4})[\s\-]?(\d{7,15})([\s\-]?\d+)*$/, { message: 'Invalid phone number format. Please provide a valid international number, e.g., +91 123 456 7890.' })
    contactNumber: string;

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value.replace(/\s+/g, ''))
    @Matches(/^(?:[A-Z]{2}[A-Z0-9]{10}[A-Z0-9]{1}|[0-9]{2}-[0-9]{7}|[A-Z0-9]{9,15})$/, {
        message: 'Invalid Tax ID. Must match GSTIN, EIN, or other valid formats.',
    })
    taxId: string;

}

export class Step2Dto {

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    confirmPassword: string;

    @IsEmail()
    @IsNotEmpty()
    mobileOtp: string;

    @IsString()
    @IsNotEmpty()
    mailOtp: string;

}

export enum MeanMonthlyRevenue {
    LessThanoneK = "Less than 1k Dollar",
    one_k_to_ten_k = "1k Dollars - 10k Dollars",
    ten_k_to_hundred_k = "10k Dollars - 100k Dollars",
    hundred_k_to_thousand_k = "100k Dollars - 1000k Dollars",
    MoreThan1000k = "More than 1000k Dollars"
}

export class Step3Dto {
    @IsArray()
    @ArrayNotEmpty({ message: 'At least one option must be selected' })
    @IsString({ each: true, message: 'Each option must be a string' })
    mainLineBusiness: string[];

    @IsEnum(MeanMonthlyRevenue)
    meanMonthlyRevenue: MeanMonthlyRevenue;

}

export class Step4Dto {

    @IsString()
    @IsNotEmpty()
    websiteUrl: string;

    @IsString()
    @IsNotEmpty()
    founderName: string;

    @IsBoolean()
    @IsNotEmpty()
    exportedBefore: boolean;

    @IsString()
    @IsNotEmpty()
    referrel: string;


}

export enum Role {
    BUYER = 'buyer',
    SELLER = 'seller',
    BOTH = 'both'

}

export class Step5Dto {
    @IsEnum(Role)
    @IsNotEmpty()
    name: Role;

}



