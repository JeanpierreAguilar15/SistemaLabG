import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { ResultadosModule } from './modules/resultados/resultados.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ComunicacionesModule } from './modules/comunicaciones/comunicaciones.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { AdminModule } from './modules/admin/admin.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Scheduled Tasks (Cron Jobs)
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL) || 60,
        limit: parseInt(process.env.THROTTLE_LIMIT) || 100,
      },
    ]),

    // Event Emitter
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    AdminModule,
    CatalogoModule,
    ResultadosModule,
    InventarioModule,
    ComunicacionesModule,
    AuditoriaModule,
    SystemConfigModule,
    ChatbotModule,
  ],
})
export class AppModule { }
