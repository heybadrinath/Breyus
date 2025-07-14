import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as multer from 'multer';
import { Request } from 'express';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  private multerInstance: any;

  constructor() {
    this.multerInstance = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb: (error: Error | null, acceptFile: boolean) => void) => {
        // Allow images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only images and PDF files are allowed'), false);
        }
      },
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    
    return new Observable(observer => {
      this.multerInstance.array('files', 10)(request, request.res, (err: any) => {
        if (err) {
          observer.error(err);
          return;
        }
        
        next.handle().subscribe({
          next: (data) => observer.next(data),
          error: (error) => observer.error(error),
          complete: () => observer.complete(),
        });
      });
    });
  }
} 