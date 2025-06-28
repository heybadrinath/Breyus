import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN;
  const corsCredentials = process.env.CORS_CREDENTIALS
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: corsCredentials,
  });
  await app.listen(process.env.PORT || 5000);
  const appName = process.env.APP_NAME;
  console.log(`${appName} is running on port ${process.env.PORT || 5000}`);
}
bootstrap();



