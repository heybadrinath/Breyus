// Initialize crypto for the application
if (typeof global.crypto === 'undefined') {
  const { webcrypto } = require('node:crypto');
  global.crypto = webcrypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common'; // Import ValidationPipe

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
    const origin = configService.get<string[]>('ORIGIN') || ['http://localhost:3000', 'https://breyus.com'];
    logger.log(`Configuring CORS for production origin: ${origin}`);
    app.enableCors({
      origin: origin,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
  }

  // Set global prefix to /backend
  app.setGlobalPrefix('backend');

  // Add Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips properties that do not have any decorators
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
    transform: true, // Automatically transform payloads to DTO instances
    disableErrorMessages: false, // Ensure error messages are not disabled
  }));

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/backend`);
}
bootstrap();
