import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser'


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN;
  const corsCredentials = process.env.CORS_CREDENTIALS
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    Headers: 'Content-Type',
    credentials: corsCredentials,
  });
   app.useGlobalPipes(
    new ValidationPipe({
      transform: true, 
      whitelist: true,
    }),
  );

  app.use(cookieParser()); // Enable cookie parser globally
  await app.listen(process.env.PORT || 5000);
  const appName = process.env.APP_NAME;
  console.log(`${appName} is running on port ${process.env.PORT || 5000}`);
}
bootstrap();



