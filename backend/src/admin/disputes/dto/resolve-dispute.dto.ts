import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResolveDisputeDto {
  @IsString()
  @MinLength(10, {
    message: 'Resolution notes must be at least 10 characters long',
  })
  @MaxLength(2000, {
    message: 'Resolution notes cannot exceed 2000 characters',
  })
  resolutionNotes: string;
}
