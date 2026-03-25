import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for blog-only user login
 * Standard email + password authentication
 */
export class BlogLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  password: string;
}

/**
 * DTO for password reset request
 * Sends OTP to email for password reset
 */
export class BlogForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

/**
 * DTO for password reset with OTP
 * Verifies OTP and sets new password
 */
export class BlogResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  otp: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  newPassword: string;
}

/**
 * DTO for password change (authenticated)
 * Changes password for logged-in user
 */
export class BlogChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  newPassword: string;
}
