import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { pino } from 'pino';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { initSentry } from './config/sentry.config';

// Initialize Sentry before app creation to capture bootstrap errors
initSentry();

async function bootstrap() {
  const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: [
            "'self'",
            'https://api.mercadopago.com',
            'https://www.mercadopago.com.ar',
            'https://sentry.io',
          ],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use(cookieParser());

  // CORS — incluye dominio canónico de prod, deploy raíz de Vercel y previews
  const DEFAULT_ALLOWED = [
    'https://www.miasesor.com.ar',
    'https://miasesor.com.ar',
    'https://tuasesor-web.vercel.app',
    'http://localhost:3000',
  ];
  const VERCEL_PREVIEW = /^https:\/\/tuasesor-web-[a-z0-9-]+\.vercel\.app$/;
  const allowedOrigins = new Set<string>([
    ...DEFAULT_ALLOWED,
    process.env.FRONTEND_URL || 'http://localhost:3000',
    ...(process.env.EXTRA_ORIGINS
      ? process.env.EXTRA_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
      : []),
  ]);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin) || VERCEL_PREVIEW.test(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS bloqueado para origen: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters and interceptors
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new GlobalExceptionFilter(),
    new SentryExceptionFilter(httpAdapter),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('MiAsesor API')
      .setDescription('SaaS Multi-Asesor con IA — Legal, Salud, Finanzas, Bienestar y Hogar')
      .setVersion('2.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.info(`MiAsesor API running on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
