import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminEventsService } from './admin-events.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot({
      // Configuración del Event Emitter
      wildcard: true, // Permitir wildcards en nombres de eventos
      delimiter: '.', // Delimitador para eventos jerárquicos
      maxListeners: 10, // Número máximo de listeners por evento
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminEventsService],
  exports: [AdminService, AdminEventsService],
})
export class AdminModule {}
