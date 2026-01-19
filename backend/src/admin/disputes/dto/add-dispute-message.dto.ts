import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class AddDisputeMessageDto {
  @IsString()
  @MinLength(1, { message: 'Message cannot be empty' })
  @MaxLength(2000, { message: 'Message cannot exceed 2000 characters' })
  content: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean = false; // Admin-only notes, not visible to users
}
