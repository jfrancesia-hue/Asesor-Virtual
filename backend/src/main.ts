import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
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
    rawBody: true, // Required for Stripe webhook signature verification
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Security
  app.use(helmet());

  // CORS
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    ...(process.env.EXTRA_ORIGINS ? process.env.EXTRA_ORIGINS.split(',').map((o) => o.trim()) : []),
  ];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
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
      .setTitle('Asesor Virtual API')
      .setDescription('SaaS Multi-Asesor con IA — Legal, Salud, Finanzas, Bienestar y Hogar')
      .setVersion('2.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.info(`Asesor Virtual API running on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
