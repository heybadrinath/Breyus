import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class loginDto {
    @IsEmail({}, { message: "Invalid Email address" })
    @IsNotEmpty({ message: "Email is required!" })
    mail: String;

    @IsString({ message: "Password must be a String!" })
    @IsNotEmpty({ message: "Password is required!" })
    password: string;
}

export class otpDto {

    @IsEmail({}, { message: "Invalid Email address" })
    @IsNotEmpty({ message: "Email is required!" })
    mail: String;    

    @IsString({ message: "Otp Must be a String!" })
    @Length(6, 6, { message: "Otp me must be 6 digit!" })
    @IsNotEmpty({ message: "Otp is required!" })
    otp: string;
}