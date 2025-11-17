import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Sistema Laboratorio Clínico Franz API')
    .setDescription('API REST para el sistema de gestión del laboratorio clínico')
    .setVersion('1.0')
    .addTag('auth', 'Autenticación y autorización')
    .addTag('usuarios', 'Gestión de usuarios')
    .addTag('agenda', 'Gestión de citas y horarios')
    .addTag('catalogo', 'Catálogo de exámenes y precios')
    .addTag('pagos', 'Cotizaciones, pagos y facturación')
    .addTag('resultados', 'Resultados de laboratorio')
    .addTag('inventario', 'Gestión de inventario')
    .addTag('comunicaciones', 'Chat y notificaciones')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║  🏥 Sistema Laboratorio Clínico Franz - API          ║
  ║                                                       ║
  ║  🚀 Server running on: http://localhost:${port}       ║
  ║  📚 API Documentation: http://localhost:${port}/api/docs ║
  ║  🌍 Environment: ${configService.get('NODE_ENV')}                 ║
  ╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
