import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsArray, ArrayNotEmpty, IsMongoId } from 'class-validator';

export class CreateMessageDto {


  @IsMongoId()
  @IsNotEmpty()
  product: string;  // ID of the related product (Product)

  @IsString()
  @IsNotEmpty()
  content: string;  // Content of the message

  @IsBoolean()
  @IsOptional()
  isRead?: boolean = false;  // Whether the message has been read (default is false)

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  attachments?: Array<{
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date;
  }> = [];  // Optional: array of file attachments (optional)
}
