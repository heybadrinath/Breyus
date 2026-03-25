import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const cookieSecret = process.env.COOKIE_SECRET;

  // CORS configuration - support multiple origins (main frontend + admin portal)
  const corsOrigins: (string | RegExp)[] = [];

  // Add main frontend origin
  if (process.env.CORS_ORIGIN) {
    corsOrigins.push(process.env.CORS_ORIGIN);
  }

  // Add admin portal origin
  if (process.env.ADMIN_PORTAL_URL) {
    corsOrigins.push(process.env.ADMIN_PORTAL_URL);
  }

  // Fallback for development
  if (corsOrigins.length === 0) {
    corsOrigins.push('http://localhost:3000', 'http://localhost:5173');
  }

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.use(cookieParser(cookieSecret));

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT || 5000);
  const appName = process.env.APP_NAME;
  console.log(`${appName} is running on port ${process.env.PORT || 5000}`);
}
bootstrap();
