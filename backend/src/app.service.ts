import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
 
  getAppName(): string {
    return process.env.APP_NAME || 'Breyus';
  }

  getVersion(): string {
    return process.env.VERSION || '1.0.0';
  }
}
