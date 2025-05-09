import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class OtpLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}