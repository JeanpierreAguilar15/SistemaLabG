import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CotizacionesController } from './cotizaciones.controller';
import { PagosController } from './pagos.controller';
import { StripeController } from './stripe.controller';
import { CotizacionesService } from './cotizaciones.service';
import { PagosService } from './pagos.service';
import { CotizacionPdfService } from './cotizacion-pdf.service';
import { StripeService } from './stripe.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [CotizacionesController, PagosController, StripeController],
  providers: [CotizacionesService, PagosService, CotizacionPdfService, StripeService],
  exports: [CotizacionesService, PagosService, CotizacionPdfService, StripeService],
})
export class PagosModule {}
