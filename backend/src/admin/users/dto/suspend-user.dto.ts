import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SuspendUserDto {
  @IsNotEmpty({ message: 'Suspension reason is required' })
  @IsString()
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason: string;
}
