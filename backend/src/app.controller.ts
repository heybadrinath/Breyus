import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

   @Get('health')
  healthCheck() {
    return {
      appName: process.env.APP_NAME || 'Breyus',
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Breyus Backend API',
      version: process.env.VERSION || '1.0.0',
    
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      hostname: process.env.HOSTNAME || 'localhost',
      port: process.env.PORT || 5000,
      database: {
        status: 'connected', // This should ideally check the actual database connection status
      },
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: process.env.CORS_CREDENTIALS === 'true',
      },
    };
  }

  @Get()
 getRoot(@Res() res: Response) {
    res
      .status(403)
      .send(`
        <!DOCTYPE html>
        <html>
          <head><title>Invalid API Access</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 100px;">
            <h1>🚫 Invalid use of API</h1>
            <p>Please access the proper endpoints via application or client.</p>
          </body>
        </html>
      `);
  }

}
