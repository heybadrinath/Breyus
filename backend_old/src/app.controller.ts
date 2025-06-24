import { Controller, Get, Post, Logger, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly usersService: UsersService
  ) {}

  @Get()
 getRoot(@Res() res: Response) {
    res
      .status(403)
      .send(`
        <html>
          <head><title>Invalid API Access</title></head>
          <body style="font-family: sans-serif; text-align: center; padding-top: 100px;">
            <h1>🚫 Invalid use of API</h1>
            <p>Please access the proper endpoints via application or client.</p>
          </body>
        </html>
      `);
  }


  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Breyus API',
      version: '1.0.0'
    };
  }
  
}
