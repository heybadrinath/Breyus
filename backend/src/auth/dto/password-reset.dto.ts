import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, Length } from 'class-validator';

export class ForgotPasswordDto {
    @IsEmail({}, { message: "Invalid Email address" })
    @IsNotEmpty({ message: "Email is required!" })
    email: string;
}

export class ResetPasswordDto {
    @IsEmail({}, { message: "Invalid Email address" })
    @IsNotEmpty({ message: "Email is required!" })
    email: string;

    @IsString({ message: "OTP must be a string!" })
    @Length(6, 6, { message: "OTP must be 6 digits!" })
    @IsNotEmpty({ message: "OTP is required!" })
    otp: string;

    @IsString({ message: "Password must be a string!" })
    @MinLength(8, { message: "Password must be at least 8 characters long!" })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    @IsNotEmpty({ message: "New password is required!" })
    newPassword: string;
}

export class ChangePasswordDto {
    @IsString({ message: "Current password must be a string!" })
    @IsNotEmpty({ message: "Current password is required!" })
    currentPassword: string;

    @IsString({ message: "New password must be a string!" })
    @MinLength(8, { message: "New password must be at least 8 characters long!" })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/, {
        message: 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    @IsNotEmpty({ message: "New password is required!" })
    newPassword: string;
}
