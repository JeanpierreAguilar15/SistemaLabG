import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Módulo de Prisma (Base de datos)
import { PrismaModule } from './prisma/prisma.module';

// Módulos de la aplicación (Monolito Modular)
import { AuthModule } from '@modules/auth/auth.module';
import { UsuariosModule } from '@modules/usuarios/usuarios.module';
import { CanchasModule } from '@modules/canchas/canchas.module';
import { ReservasModule } from '@modules/reservas/reservas.module';
import { PagosModule } from '@modules/pagos/pagos.module';
import { NotificacionesModule } from '@modules/notificaciones/notificaciones.module';
import { ConfiguracionModule } from '@modules/configuracion/configuracion.module';

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting global
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('RATE_LIMIT_TTL', 60) * 1000, // Default: 60 seconds
            limit: config.get<number>('RATE_LIMIT_MAX', 100),     // Default: 100 requests
          },
        ],
      }),
    }),

    // Módulo de base de datos
    PrismaModule,

    // Módulo de configuración (global)
    ConfiguracionModule,

    // Módulos del dominio (cada uno es independiente)
    AuthModule,
    UsuariosModule,
    CanchasModule,
    ReservasModule,
    PagosModule,
    NotificacionesModule,
  ],
  providers: [
    // Apply throttler guard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
