import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
 
  getAppName(): string {
    return process.env.APP_NAME || '';
  }

  getVersion(): string {
    return process.env.VERSION || '';
  }
}
