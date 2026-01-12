import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Módulo de Prisma (Base de datos)
import { PrismaModule } from './prisma/prisma.module';

// Módulos de la aplicación (Monolito Modular)
import { AuthModule } from '@modules/auth/auth.module';
import { UsuariosModule } from '@modules/usuarios/usuarios.module';
import { CanchasModule } from '@modules/canchas/canchas.module';
import { ReservasModule } from '@modules/reservas/reservas.module';
import { PagosModule } from '@modules/pagos/pagos.module';
import { NotificacionesModule } from '@modules/notificaciones/notificaciones.module';

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Módulo de base de datos
    PrismaModule,

    // Módulos del dominio (cada uno es independiente)
    AuthModule,
    UsuariosModule,
    CanchasModule,
    ReservasModule,
    PagosModule,
    NotificacionesModule,
  ],
})
export class AppModule {}
