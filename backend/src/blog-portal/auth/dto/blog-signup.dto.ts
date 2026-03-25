import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for blog-only user signup
 * Used when users sign up directly for the blog portal without a Breyus account
 */
export class BlogSignupDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  companyName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  website?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  areaOfInterest?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  experience?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  areaOfExpertise?: string;
}

/**
 * DTO for Breyus member OTP request
 * First step of Breyus SSO - sends OTP to verified Breyus email
 */
export class BreyusMemberOtpRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

/**
 * DTO for Breyus member OTP verification
 * Second step of Breyus SSO - verifies OTP and creates/updates blog user
 */
export class BreyusMemberOtpVerifyDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  otp: string;
}
