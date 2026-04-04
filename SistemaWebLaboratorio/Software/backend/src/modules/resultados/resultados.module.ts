import { Module, forwardRef } from '@nestjs/common';
import { ResultadosController } from './resultados.controller';
import { ResultadosService } from './resultados.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { PrismaModule } from '@prisma/prisma.module';
import { InventarioModule } from '../inventario/inventario.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => InventarioModule),
    forwardRef(() => AdminModule),
  ],
  controllers: [ResultadosController],
  providers: [ResultadosService, PdfGeneratorService],
  exports: [ResultadosService, PdfGeneratorService],
})
export class ResultadosModule {}
