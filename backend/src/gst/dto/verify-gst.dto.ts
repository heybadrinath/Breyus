import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class VerifyGSTDto {
  @IsString()
  @IsNotEmpty({ message: 'GSTIN is required' })
  @Length(15, 15, { message: 'GSTIN must be exactly 15 characters' })
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, {
    message: 'Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5',
  })
  gstin: string;

  @IsString()
  @IsNotEmpty({ message: 'Company name is required for verification' })
  companyName: string;
}
