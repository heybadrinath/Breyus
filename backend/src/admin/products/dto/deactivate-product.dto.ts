import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class DeactivateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Reason must be at least 10 characters' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason: string;
}
