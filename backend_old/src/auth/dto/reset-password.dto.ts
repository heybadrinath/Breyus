import { IsEmail, IsNotEmpty, IsString, Length, MinLength, IsOptional } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Length(6, 6)
  otp: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword: string;
  
  @IsString()
  @IsOptional()
  role?: string;
} 