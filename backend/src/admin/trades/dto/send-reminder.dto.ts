import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendReminderDto {
  @IsIn(['both', 'buyer', 'seller'])
  recipientType: 'both' | 'buyer' | 'seller';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customMessage?: string;
}
