import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import * as multer from 'multer';
import { Observable } from 'rxjs';

const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

@Injectable()
export class DocumentUploadInterceptor implements NestInterceptor {
  private readonly multerInstance = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 10,
    },
    fileFilter: (
      _request,
      file,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (ALLOWED_DOCUMENT_MIME_TYPES.has(file.mimetype)) {
        callback(null, true);
        return;
      }

      callback(
        new BadRequestException(
          'Unsupported document type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.',
        ),
        false,
      );
    },
  });

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    return new Observable((observer) => {
      this.multerInstance.array('files', 10)(
        request,
        request.res!,
        (error: any) => {
          if (error) {
            observer.error(
              error instanceof HttpException
                ? error
                : new BadRequestException(error.message),
            );
            return;
          }

          next.handle().subscribe({
            next: (data) => observer.next(data),
            error: (nextError) => observer.error(nextError),
            complete: () => observer.complete(),
          });
        },
      );
    });
  }
}
