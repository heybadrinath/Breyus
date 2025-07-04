import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, Length } from 'class-validator';
import { } from 'class-transformer'

export class loginDto {
    @IsEmail({}, { message: "Invalid Email address" })
    @IsNotEmpty({ message: "Email is required!" })
    mail: String;

    @IsString({ message: "Password must be a String!" })
    @MinLength(8, { message: "Password must be atleast 8 characters long!" })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
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