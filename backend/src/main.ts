import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser'
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN;
  const corsCredentials = process.env.CORS_CREDENTIALS;
  const cookieSecret = process.env.COOKIE_SECRET;
  
  app.enableCors({
    origin: corsOrigin,
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

