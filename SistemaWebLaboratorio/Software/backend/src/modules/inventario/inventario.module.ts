import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';
import { OcrFacturaService } from './services/ocr-factura.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule, ConfigModule],
    controllers: [InventarioController],
    providers: [InventarioService, OcrFacturaService],
    exports: [InventarioService],
})
export class InventarioModule { }
