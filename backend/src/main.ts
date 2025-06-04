// Initialize crypto for the application
if (typeof global.crypto === 'undefined') {
  const { webcrypto } = require('node:crypto');
  global.crypto = webcrypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 5000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  
  // More permissive CORS for development
  if (nodeEnv === 'development') {
    logger.log('Configuring CORS for development (allowing all origins)');
    app.enableCors({
      origin: true, // Allow all origins in development
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'Content-Type,Accept,Authorization',
    });
  } else {
    const origin = configService.get<string>('ORIGIN', 'http://localhost:3000');
    logger.log(`Configuring CORS for production origin: ${origin}`);
    app.enableCors({
      origin: origin,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
  }

  // Set global prefix to /backend
  app.setGlobalPrefix('backend');

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/backend`);
}
bootstrap();
