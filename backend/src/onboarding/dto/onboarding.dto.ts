import { IsEmail, IsString, IsNotEmpty, IsBoolean, IsEnum, IsArray, ArrayNotEmpty, ArrayUnique, isNotEmpty} from 'class-validator';

export class Step1Dto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsEmail()
    @IsNotEmpty()
    mail: string;

    @IsString()
    @IsNotEmpty()
    contactNumber: string;

    @IsString()
    @IsNotEmpty()
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

export enum MeanMonthlyRevenue{
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

export enum Role{
    BUYER = 'buyer',
    SELLER = 'seller',
    BOTH = 'both'
    
}

export class Step5Dto {
    @IsEnum(Role)
    @IsNotEmpty()
    name: Role;

}



