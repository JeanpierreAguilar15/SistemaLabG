import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para la API
  app.setGlobalPrefix('api/v1');

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger/OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Centro Deportivo API')
    .setDescription('API para el Sistema de Gestión de Reservas de Canchas Deportivas')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticación de usuarios')
    .addTag('usuarios', 'Gestión de usuarios')
    .addTag('canchas', 'Gestión de canchas deportivas')
    .addTag('reservas', 'Gestión de reservas')
    .addTag('pagos', 'Gestión de pagos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
    🏟️  Centro Deportivo API
    ========================
    🚀 Servidor corriendo en: http://localhost:${port}
    📚 Documentación API: http://localhost:${port}/api/docs
    🔧 Ambiente: ${process.env.NODE_ENV || 'development'}
  `);
}

bootstrap();
