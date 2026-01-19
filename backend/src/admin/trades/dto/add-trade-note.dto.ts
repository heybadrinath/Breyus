import { IsString, MinLength, MaxLength } from 'class-validator';

export class AddTradeNoteDto {
  @IsString()
  @MinLength(3, { message: 'Note must be at least 3 characters long' })
  @MaxLength(1000, { message: 'Note cannot exceed 1000 characters' })
  content: string;
}
