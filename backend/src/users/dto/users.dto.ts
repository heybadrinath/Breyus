import { IsEmail, IsString, IsNotEmpty, IsEnum, IsOptional, IsMongoId, MinLength, isNotEmpty } from 'class-validator';
import {Role} from 'src/users/user.schema'; // Import the Role enum from user.schema

export class CreateUserDto {
  
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;


  @IsEnum(Role)
  @IsNotEmpty()
  role: Role; 

  @IsMongoId()
  @IsOptional()
  company?: string;

}

export class UpdateUserDto {
  
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @IsString()
  @IsNotEmpty()
  password?: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(Role)
  role?: Role; 

  @IsMongoId()
  @IsOptional()
  company?: string;
}
