import { Module, forwardRef } from '@nestjs/common';
import { ResultadosController } from './resultados.controller';
import { ResultadosService } from './resultados.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => EventsModule),
  ],
  controllers: [ResultadosController],
  providers: [ResultadosService, PdfGeneratorService],
  exports: [ResultadosService, PdfGeneratorService],
})
export class ResultadosModule {}
