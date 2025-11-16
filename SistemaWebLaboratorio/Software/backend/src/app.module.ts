import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AgendaModule } from './modules/agenda/agenda.module';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { ResultadosModule } from './modules/resultados/resultados.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ComunicacionesModule } from './modules/comunicaciones/comunicaciones.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL) || 60,
        limit: parseInt(process.env.THROTTLE_LIMIT) || 100,
      },
    ]),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    AgendaModule,
    CatalogoModule,
    PagosModule,
    ResultadosModule,
    InventarioModule,
    ComunicacionesModule,
    AuditoriaModule,
  ],
})
export class AppModule {}
