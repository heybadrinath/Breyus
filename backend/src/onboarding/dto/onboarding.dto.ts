import { IsEmail, IsString, IsNotEmpty, IsBoolean, IsEnum, IsArray, ArrayNotEmpty, Matches, Length, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';



// step 1 dto's
export class SendEmailOtpDto {
    @IsEmail({}, { message: "Invalid Email address" })
    @IsNotEmpty({ message: "Email is required!" })
    email: String;
}

export class VerifyEmailOtpDto {

    @IsEmail({}, { message: "Invalid Email address" })
    @IsNotEmpty({ message: "Email is required!" })
    email: String;

    @IsString({ message: "Otp Must be a String!" })
    @Length(6, 6, { message: "Otp me must be 6 digit!" })
    @IsNotEmpty({ message: "Otp is required!" })
    otp: string;
}

export class SetPasswordDto {

    @IsString({ message: "Password must be a String!" })
    @MinLength(8, { message: "Password must be atleast 8 characters long!" })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    @IsNotEmpty({message: "Password is required!"})
    setPassword: string;

     @IsString({ message: "Confirm Password must be a String!" })
    @MinLength(8, { message: "Confirm Password must be atleast 8 characters long!" })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    @IsNotEmpty({message: "Password is required!"})
    confirmPassword: string;

}

export class continueOnboardingDto {

    @IsString({message: "Password must be a String"})
    @IsNotEmpty({message: "Password is required!"})
    password: string;
}


// step 2 dto' s

export class Step2Dto {

    @IsString()
    @IsNotEmpty()
    companyName: string;

    @IsString()
    @IsNotEmpty()
    companyAddress: string;

    @IsString()
    @IsNotEmpty()
    companyMobile: string;

    @IsString()
    @IsNotEmpty()
    taxId: string;

}

export enum MeanMonthlyRevenue {
    LessThanoneK = "Less than 1k Dollar",
    one_k_to_ten_k = "1k Dollars - 10k Dollars",
    ten_k_to_hundred_k = "10k Dollars - 100k Dollars",
    hundred_k_to_thousand_k = "100k Dollars - 1000k Dollars",
    MoreThan1000k = "More than 1000k Dollars"
}

// step 3 dto's

export class Step3Dto {
    @IsArray()
    @ArrayNotEmpty({ message: 'At least one option must be selected' })
    @IsString({ each: true, message: 'Each option must be a string' })
    mainLineBusiness: string[];

    @IsEnum(MeanMonthlyRevenue)
    meanMonthlyRevenue: MeanMonthlyRevenue;

}

// step 4 dto's 

export class Step4Dto {

    @IsString()
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
    BUYER = 'Buyer',
    SELLER = 'Seller',
    BOTH = 'Seller and Buyer'

}

 // step 5 dto's

export class Step5Dto {
    @IsEnum(Role)
    @IsNotEmpty()
    role: Role;

}



