import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import type {
  NextFunction,
  Request,
  Response as ExpressResponse,
} from 'express';
import { StorageService } from './common/storage';

function getUploadContentType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    csv: 'text/csv',
    gif: 'image/gif',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    json: 'application/json',
    pdf: 'application/pdf',
    png: 'image/png',
    svg: 'image/svg+xml',
    txt: 'text/plain',
    webp: 'image/webp',
  };

  return contentTypes[extension || ''] || 'application/octet-stream';
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const cookieSecret = process.env.COOKIE_SECRET;

  // A single-origin deployment uses /api so the frontend and admin routes do
  // not collide with the API. Existing environments remain unchanged.
  const apiGlobalPrefix = process.env.API_GLOBAL_PREFIX?.replace(
    /^\/+|\/+$/g,
    '',
  );
  if (apiGlobalPrefix) {
    app.setGlobalPrefix(apiGlobalPrefix);
  }

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

  const staticSiteRoot = process.env.STATIC_SITE_ROOT;
  if (staticSiteRoot) {
    if (!apiGlobalPrefix) {
      throw new Error(
        'API_GLOBAL_PREFIX is required when STATIC_SITE_ROOT is configured.',
      );
    }

    // Static files are registered before Nest initializes its routes. The SPA
    // fallback explicitly skips backend paths so API and WebSocket requests
    // continue into Nest instead of receiving index.html.
    app.useStaticAssets(staticSiteRoot, { index: false });

    const expressApp = app.getHttpAdapter().getInstance();

    if (process.env.STORAGE_PROVIDER === 's3') {
      const storageService = app.get(StorageService);
      expressApp.use(
        '/uploads',
        async (
          request: Request,
          response: ExpressResponse,
          next: NextFunction,
        ) => {
          if (!['GET', 'HEAD'].includes(request.method)) {
            next();
            return;
          }

          const storagePath = request.path;
          if (!storagePath || storagePath.includes('..')) {
            response.sendStatus(400);
            return;
          }

          try {
            if (!(await storageService.exists(storagePath))) {
              next();
              return;
            }

            response.setHeader(
              'Content-Type',
              getUploadContentType(storagePath),
            );
            response.setHeader('Cache-Control', 'public, max-age=86400');

            if (request.method === 'HEAD') {
              response.end();
              return;
            }

            const stream = await storageService.getFileStream(storagePath);
            stream.on('error', next);
            stream.pipe(response);
          } catch (error) {
            next(error);
          }
        },
      );
    }

    expressApp.use(
      (request: Request, response: ExpressResponse, next: NextFunction) => {
        const backendPaths = [`/${apiGlobalPrefix}`, '/uploads', '/socket.io'];
        const isBackendPath = backendPaths.some(
          (path) =>
            request.path === path || request.path.startsWith(`${path}/`),
        );

        if (
          isBackendPath ||
          request.method !== 'GET' ||
          !request.accepts('html')
        ) {
          return next();
        }

        const isAdminRoute =
          request.path === '/admin' || request.path.startsWith('/admin/');
        const indexFile = isAdminRoute
          ? join(staticSiteRoot, 'admin', 'index.html')
          : join(staticSiteRoot, 'index.html');

        return response.sendFile(indexFile);
      },
    );
  }

  await app.listen(process.env.PORT || 5000);
  const appName = process.env.APP_NAME;
  console.log(`${appName} is running on port ${process.env.PORT || 5000}`);
}
bootstrap();
