import { IsOptional, IsEmail, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  mail?: string;

  @IsOptional()
  @IsIn(['admin', 'user'], {
    message: 'Role must be either "admin" (Buyer) or "user" (Seller)',
  })
  role?: 'admin' | 'user';
}
