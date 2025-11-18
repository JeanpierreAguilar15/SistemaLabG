import { Module } from '@nestjs/common';
import { CotizacionesController } from './cotizaciones.controller';
import { PagosController } from './pagos.controller';
import { CotizacionesService } from './cotizaciones.service';
import { PagosService } from './pagos.service';
import { CotizacionPdfService } from './cotizacion-pdf.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CotizacionesController, PagosController],
  providers: [CotizacionesService, PagosService, CotizacionPdfService],
  exports: [CotizacionesService, PagosService, CotizacionPdfService],
})
export class PagosModule {}
