import { Module } from '@nestjs/common';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { ReservasModule } from '@modules/reservas/reservas.module';
import { NotificacionesModule } from '@modules/notificaciones/notificaciones.module';

@Module({
  imports: [ReservasModule, NotificacionesModule],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
