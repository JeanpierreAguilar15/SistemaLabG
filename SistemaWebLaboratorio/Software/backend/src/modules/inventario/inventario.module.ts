import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InventarioController } from './inventario.controller';
import { InventarioService } from './inventario.service';
import { OcrFacturaService } from './services/ocr-factura.service';
import { AlertasProgramadasService } from './services/alertas-programadas.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ComunicacionesModule } from '../comunicaciones/comunicaciones.module';

@Module({
    imports: [PrismaModule, ConfigModule, ComunicacionesModule],
    controllers: [InventarioController],
    providers: [InventarioService, OcrFacturaService, AlertasProgramadasService],
    exports: [InventarioService, AlertasProgramadasService],
})
export class InventarioModule { }
