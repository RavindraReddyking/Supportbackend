import 'reflect-metadata';
import cookieParser = require('cookie-parser');
import { TrimInterceptor } from './common/interceptors/trim.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ GLOBAL TRIM (ADD THIS LINE)
  app.useGlobalInterceptors(new TrimInterceptor());

  const corsOrigins = process.env.CORS_ORIGINS ?? '';
  const allowedOrigins = corsOrigins
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = Number(process.env.PORT);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('PORT is not configured correctly');
  }

  await app.listen(port);
}

void bootstrap();