import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    forbidUnknownValues: false,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors) => {
      // Aplanar mensajes amigables para el frontend
      const details = (errors || []).map(e => {
        const c = e.constraints ? Object.values(e.constraints) : [];
        return c.join(', ');
      }).filter(Boolean);
      const message = details.length ? details.join(' | ') : 'Datos inválidos';
      return new (require('@nestjs/common').BadRequestException)(message);
    },
  }));
  // Registrar filtro global de errores para auditar en auditoria.tb_error
  app.useGlobalFilters(app.get(GlobalExceptionFilter));
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true });
  await app.listen(process.env.PORT ? parseInt(process.env.PORT, 10) : 3001);
}

bootstrap();
