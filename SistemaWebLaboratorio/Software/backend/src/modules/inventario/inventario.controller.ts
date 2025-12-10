import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags, ApiConsumes, ApiBody, ApiQuery, ApiProduces } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { InventarioService } from './inventario.service';
import { OcrFacturaService } from './services/ocr-factura.service';
import { AlertasProgramadasService } from './services/alertas-programadas.service';
import { PdfInventarioService } from './services/pdf-inventario.service';
import { WhatsAppService } from '../comunicaciones/whatsapp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateMovimientoDto,
} from './dto';

@ApiTags('Inventario')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class InventarioController {
  constructor(
    private readonly inventarioService: InventarioService,
    private readonly ocrFacturaService: OcrFacturaService,
    private readonly alertasProgramadasService: AlertasProgramadasService,
    private readonly pdfInventarioService: PdfInventarioService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  // ==================== INVENTARIO ====================

  @Get('inventory/items')
  @ApiOperation({
    summary: 'Obtener todos los ítems de inventario con filtros avanzados',
    description: 'Soporta paginación, búsqueda, filtros por categoría, stock, precio y ordenamiento',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items por página (default: 50)' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, código interno o descripción' })
  @ApiQuery({ name: 'codigo_categoria', required: false, description: 'Filtrar por código de categoría' })
  @ApiQuery({ name: 'activo', required: false, description: 'Filtrar por estado activo (true/false)' })
  @ApiQuery({ name: 'stock_bajo', required: false, description: 'Mostrar solo items con stock bajo (true)' })
  @ApiQuery({ name: 'stock_min', required: false, description: 'Stock mínimo' })
  @ApiQuery({ name: 'stock_max', required: false, description: 'Stock máximo' })
  @ApiQuery({ name: 'costo_min', required: false, description: 'Costo unitario mínimo' })
  @ApiQuery({ name: 'costo_max', required: false, description: 'Costo unitario máximo' })
  @ApiQuery({ name: 'unidad_medida', required: false, description: 'Filtrar por unidad de medida' })
  @ApiQuery({ name: 'sort_by', required: false, description: 'Campo para ordenar: nombre, codigo_interno, stock_actual, costo_unitario, fecha_creacion, categoria' })
  @ApiQuery({ name: 'sort_order', required: false, description: 'Orden: asc o desc' })
  async getAllInventoryItems(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any,
  ) {
    return this.inventarioService.getAllInventoryItems(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      filters,
    );
  }

  @Get('inventory/items/:id')
  async getInventoryItemById(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.getInventoryItemById(id);
  }

  @Post('inventory/items')
  @HttpCode(HttpStatus.CREATED)
  async createInventoryItem(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreateInventoryItemDto,
  ) {
    return this.inventarioService.createInventoryItem(data, adminId);
  }

  @Put('inventory/items/:id')
  async updateInventoryItem(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateInventoryItemDto,
  ) {
    return this.inventarioService.updateInventoryItem(id, data, adminId);
  }

  @Delete('inventory/items/:id')
  async deleteInventoryItem(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inventarioService.deleteInventoryItem(id, adminId);
  }

  @Get('inventory/kardex/report')
  async getKardexReport() {
    return this.inventarioService.getKardexReport();
  }

  @Get('inventory/kardex/global')
  @ApiOperation({
    summary: 'Kardex Global - Resumen de todos los items',
    description: 'Retorna un resumen completo del inventario con totales de entradas/salidas, stock actual, valor y estado de cada item.',
  })
  async getKardexGlobal(
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
    @Query('categoria') categoria?: string,
  ) {
    return this.inventarioService.getKardexGlobal({
      fecha_desde,
      fecha_hasta,
      categoria: categoria ? parseInt(categoria, 10) : undefined,
    });
  }

  @Put('inventory/items/:id/toggle-status')
  async toggleInventoryItemStatus(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inventarioService.toggleInventoryItemStatus(id, adminId);
  }

  // ==================== MOVIMIENTOS DE STOCK ====================

  @Post('inventory/movements')
  @HttpCode(HttpStatus.CREATED)
  async createMovimiento(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreateMovimientoDto,
  ) {
    return this.inventarioService.createMovimiento(data, adminId);
  }

  @Get('inventory/movements')
  async getAllMovimientos(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any,
  ) {
    return this.inventarioService.getAllMovimientos(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      filters,
    );
  }

  @Get('inventory/kardex/:itemId')
  async getKardexByItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
  ) {
    return this.inventarioService.getKardexByItem(itemId, fecha_desde, fecha_hasta);
  }

  // ==================== ALERTAS DE STOCK ====================

  @Get('inventory/alertas')
  async getAlertasStock(
    @Query('tipo') tipo?: string,
    @Query('codigo_item') codigo_item?: string,
    @Query('activo') activo?: string,
  ) {
    const filters: any = {};
    if (tipo) filters.tipo = tipo;
    if (codigo_item) filters.codigo_item = parseInt(codigo_item);
    if (activo) filters.activo = activo;

    return this.inventarioService.getAlertasStock(filters);
  }

  @Get('inventory/alertas/estadisticas')
  async getEstadisticasAlertas() {
    return this.inventarioService.getEstadisticasAlertas();
  }

  // ==================== PROVEEDORES ====================

  @Get('suppliers')
  async getAllSuppliers() {
    return this.inventarioService.getAllSuppliers();
  }

  @Get('suppliers/:id')
  async getSupplierById(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.getSupplierById(id);
  }

  @Post('suppliers')
  @HttpCode(HttpStatus.CREATED)
  async createSupplier(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreateSupplierDto,
  ) {
    return this.inventarioService.createSupplier(data, adminId);
  }

  @Put('suppliers/:id')
  async updateSupplier(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSupplierDto,
  ) {
    return this.inventarioService.updateSupplier(id, data, adminId);
  }

  @Delete('suppliers/:id')
  async deleteSupplier(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inventarioService.deleteSupplier(id, adminId);
  }

  // ==================== CATEGORÍAS ====================

  @Get('inventory/categories')
  @ApiOperation({ summary: 'Obtener todas las categorías de items' })
  async getAllCategories() {
    return this.inventarioService.getAllCategories();
  }

  @Get('inventory/categories/:id')
  @ApiOperation({ summary: 'Obtener categoría por ID' })
  async getCategoryById(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.getCategoryById(id);
  }

  @Post('inventory/categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nueva categoría' })
  async createCategory(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: { nombre: string; descripcion?: string },
  ) {
    return this.inventarioService.createCategory(data, adminId);
  }

  @Put('inventory/categories/:id')
  @ApiOperation({ summary: 'Actualizar categoría' })
  async updateCategory(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { nombre?: string; descripcion?: string },
  ) {
    return this.inventarioService.updateCategory(id, data, adminId);
  }

  @Delete('inventory/categories/:id')
  @ApiOperation({ summary: 'Eliminar categoría' })
  async deleteCategory(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inventarioService.deleteCategory(id, adminId);
  }

  // ==================== LOTES ====================

  @Get('inventory/lotes')
  @ApiOperation({ summary: 'Obtener todos los lotes' })
  async getAllLotes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any,
  ) {
    return this.inventarioService.getAllLotes(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      filters,
    );
  }

  @Get('inventory/lotes/:id')
  @ApiOperation({ summary: 'Obtener lote por ID' })
  async getLoteById(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.getLoteById(id);
  }

  @Post('inventory/lotes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo lote (ingreso de mercadería)' })
  async createLote(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: {
      codigo_item: number;
      numero_lote: string;
      fecha_fabricacion?: Date;
      fecha_vencimiento?: Date;
      cantidad_inicial: number;
      proveedor?: string;
    },
  ) {
    return this.inventarioService.createLote(data, adminId);
  }

  @Put('inventory/lotes/:id')
  @ApiOperation({ summary: 'Actualizar información del lote' })
  async updateLote(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: {
      numero_lote?: string;
      fecha_fabricacion?: Date;
      fecha_vencimiento?: Date;
      proveedor?: string;
    },
  ) {
    return this.inventarioService.updateLote(id, data, adminId);
  }

  @Get('inventory/items/:itemId/lotes')
  @ApiOperation({ summary: 'Obtener lotes de un item específico' })
  async getLotesByItem(@Param('itemId', ParseIntPipe) itemId: number) {
    return this.inventarioService.getLotesByItem(itemId);
  }

  // ==================== KARDEX Y EXAMEN-INSUMO ====================

  @Get('inventory/items/:itemId/kardex')
  @ApiOperation({ summary: 'Obtener kardex completo de un item (historial de movimientos)' })
  async getKardexCompletoItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
    @Query('tipo_movimiento') tipo_movimiento?: string,
  ) {
    return this.inventarioService.getKardexCompletoItem(itemId, {
      fecha_desde,
      fecha_hasta,
      tipo_movimiento,
    });
  }

  @Get('examenes/:examenId/insumos')
  @ApiOperation({ summary: 'Obtener insumos requeridos para un examen' })
  async getExamenInsumos(@Param('examenId', ParseIntPipe) examenId: number) {
    return this.inventarioService.getExamenInsumos(examenId);
  }

  @Post('examenes/:examenId/insumos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Asignar insumo a un examen' })
  async createExamenInsumo(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('examenId', ParseIntPipe) examenId: number,
    @Body() data: { codigo_item: number; cantidad_requerida: number },
  ) {
    return this.inventarioService.createExamenInsumo(
      { ...data, codigo_examen: examenId },
      adminId,
    );
  }

  @Put('examenes/insumos/:id')
  @ApiOperation({ summary: 'Actualizar cantidad de insumo requerido' })
  async updateExamenInsumo(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { cantidad_requerida?: number; activo?: boolean },
  ) {
    return this.inventarioService.updateExamenInsumo(id, data, adminId);
  }

  @Delete('examenes/insumos/:id')
  @ApiOperation({ summary: 'Eliminar insumo de un examen' })
  async deleteExamenInsumo(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inventarioService.deleteExamenInsumo(id, adminId);
  }

  @Get('examenes/:examenId/verificar-stock')
  @ApiOperation({ summary: 'Verificar si hay stock suficiente para un examen' })
  async verificarStockExamen(@Param('examenId', ParseIntPipe) examenId: number) {
    return this.inventarioService.verificarStockExamen(examenId);
  }

  @Post('examenes/verificar-stock-multiple')
  @ApiOperation({ summary: 'Verificar stock para múltiples exámenes' })
  async verificarStockExamenes(@Body() data: { codigos_examenes: number[] }) {
    return this.inventarioService.verificarStockExamenes(data.codigos_examenes);
  }

  // ==================== ÓRDENES DE COMPRA ====================

  @Post('purchase-orders')
  @ApiOperation({ summary: 'Crear orden de compra' })
  async createPurchaseOrder(@Body() data: any, @CurrentUser('codigo_usuario') adminId: number) {
    return this.inventarioService.createOrdenCompra(data, adminId);
  }

  @Get('purchase-orders')
  @ApiOperation({ summary: 'Obtener todas las órdenes de compra' })
  async getAllPurchaseOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any,
  ) {
    return this.inventarioService.getAllOrdenesCompra(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      filters,
    );
  }

  @Get('purchase-orders/:id')
  @ApiOperation({ summary: 'Obtener orden de compra por ID' })
  async getPurchaseOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.getOrdenCompraById(id);
  }

  @Put('purchase-orders/:id')
  @ApiOperation({ summary: 'Actualizar orden de compra' })
  async updatePurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser('codigo_usuario') adminId: number,
  ) {
    return this.inventarioService.updateOrdenCompra(id, data, adminId);
  }

  @Delete('purchase-orders/:id')
  @ApiOperation({ summary: 'Eliminar orden de compra' })
  async deletePurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('codigo_usuario') adminId: number,
  ) {
    return this.inventarioService.deleteOrdenCompra(id, adminId);
  }

  @Post('purchase-orders/:id/emit')
  @ApiOperation({ summary: 'Emitir orden de compra' })
  async emitPurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('codigo_usuario') adminId: number,
  ) {
    return this.inventarioService.emitirOrdenCompra(id, adminId);
  }

  @Post('purchase-orders/:id/receive')
  @ApiOperation({ summary: 'Recibir orden de compra' })
  async receivePurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser('codigo_usuario') adminId: number,
  ) {
    return this.inventarioService.recibirOrdenCompra(id, data, adminId);
  }

  @Post('purchase-orders/:id/cancel')
  @ApiOperation({ summary: 'Cancelar orden de compra' })
  async cancelPurchaseOrder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('codigo_usuario') adminId: number,
  ) {
    return this.inventarioService.cancelarOrdenCompra(id, adminId);
  }

  // ==================== OCR FACTURAS ====================

  @Get('inventory/ocr/status')
  @ApiOperation({ summary: 'Verificar si el OCR está configurado' })
  async getOcrStatus() {
    return {
      configured: this.ocrFacturaService.isConfigured(),
      message: this.ocrFacturaService.isConfigured()
        ? 'OCR de facturas configurado y listo'
        : 'API Key de Gemini no configurada',
    };
  }

  @Post('inventory/ocr/process-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Procesar imagen de factura con OCR' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Imagen de la factura (JPG, PNG, PDF)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/facturas',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `factura-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Tipo de archivo no permitido. Use JPG, PNG o PDF.'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async processFacturaImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const result = await this.ocrFacturaService.processFacturaImage(file.path);

    // Eliminar el archivo después de procesarlo
    const fs = await import('fs');
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      // Ignorar error si no se puede eliminar
    }

    return result;
  }

  @Post('inventory/ocr/process-base64')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Procesar imagen de factura en base64 con OCR' })
  async processFacturaBase64(
    @Body() data: { image: string; mimeType?: string },
  ) {
    if (!data.image) {
      throw new BadRequestException('No se proporcionó ninguna imagen');
    }

    const mimeType = data.mimeType || 'image/jpeg';
    return this.ocrFacturaService.processFacturaBase64(data.image, mimeType);
  }

  @Post('inventory/ocr/create-from-result')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear lotes en inventario desde resultado de OCR' })
  async createLotesFromOcr(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: {
      items: Array<{
        codigo_item: number;
        numero_lote: string;
        cantidad: number;
        fecha_vencimiento?: string;
      }>;
      codigo_proveedor?: number;
    },
  ) {
    const results = [];

    for (const item of data.items) {
      try {
        const lote = await this.inventarioService.createLote({
          codigo_item: item.codigo_item,
          numero_lote: item.numero_lote,
          cantidad_inicial: item.cantidad,
          fecha_vencimiento: item.fecha_vencimiento ? new Date(item.fecha_vencimiento) : undefined,
          proveedor: data.codigo_proveedor?.toString(),
        }, adminId);

        results.push({
          success: true,
          codigo_item: item.codigo_item,
          lote,
        });
      } catch (error) {
        results.push({
          success: false,
          codigo_item: item.codigo_item,
          error: error.message,
        });
      }
    }

    return {
      total: data.items.length,
      exitosos: results.filter(r => r.success).length,
      fallidos: results.filter(r => !r.success).length,
      results,
    };
  }

  // ==================== WORKFLOW AUTOMATIZADO ====================

  @Post('inventory/factura/procesar-automatico')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Procesar factura automáticamente (OCR + crear proveedor + crear lotes)',
    description: 'Sube una imagen de factura, extrae datos con IA y crea automáticamente el proveedor (si no existe) y los lotes de inventario',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Imagen de la factura (JPG, PNG, PDF)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/facturas',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `factura-auto-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Tipo de archivo no permitido. Use JPG, PNG o PDF.'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async procesarFacturaAutomatico(
    @CurrentUser('codigo_usuario') adminId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // 1. Procesar imagen con OCR
    const ocrResult = await this.ocrFacturaService.processFacturaImage(file.path);

    // Eliminar archivo después de procesar
    const fs = await import('fs');
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      // Ignorar error si no se puede eliminar
    }

    if (!ocrResult.success) {
      throw new BadRequestException(`Error procesando factura: ${ocrResult.error}`);
    }

    // 2. Procesar datos extraídos y crear proveedor/lotes
    const resultado = await this.inventarioService.procesarFacturaAutomatico(
      {
        proveedor: ocrResult.proveedor,
        factura: ocrResult.factura,
        items: ocrResult.items,
      },
      adminId,
    );

    return {
      ocr: {
        success: ocrResult.success,
        proveedor_detectado: ocrResult.proveedor,
        factura_detectada: ocrResult.factura,
        items_detectados: ocrResult.items.length,
      },
      procesamiento: resultado,
    };
  }

  @Post('inventory/factura/procesar-automatico-base64')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Procesar factura automáticamente desde base64',
    description: 'Envía imagen en base64, extrae datos con IA y crea automáticamente proveedor y lotes',
  })
  async procesarFacturaAutomaticoBase64(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: { image: string; mimeType?: string },
  ) {
    if (!data.image) {
      throw new BadRequestException('No se proporcionó ninguna imagen');
    }

    // 1. Procesar imagen con OCR
    const mimeType = data.mimeType || 'image/jpeg';
    const ocrResult = await this.ocrFacturaService.processFacturaBase64(data.image, mimeType);

    if (!ocrResult.success) {
      throw new BadRequestException(`Error procesando factura: ${ocrResult.error}`);
    }

    // 2. Procesar datos extraídos y crear proveedor/lotes
    const resultado = await this.inventarioService.procesarFacturaAutomatico(
      {
        proveedor: ocrResult.proveedor,
        factura: ocrResult.factura,
        items: ocrResult.items,
      },
      adminId,
    );

    return {
      ocr: {
        success: ocrResult.success,
        proveedor_detectado: ocrResult.proveedor,
        factura_detectada: ocrResult.factura,
        items_detectados: ocrResult.items.length,
      },
      procesamiento: resultado,
    };
  }

  // ==================== WHATSAPP Y ALERTAS ====================

  @Get('inventory/whatsapp/config')
  @ApiOperation({ summary: 'Verificar configuración de WhatsApp' })
  async getWhatsAppConfig() {
    return this.whatsAppService.getConfig();
  }

  @Post('inventory/whatsapp/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar mensaje de prueba por WhatsApp' })
  async testWhatsApp(
    @Body() data: { mensaje?: string; numero?: string },
  ) {
    const mensaje = data.mensaje || '🔬 Mensaje de prueba del Sistema de Laboratorio';
    return this.whatsAppService.sendMessage({
      to: data.numero || '',
      message: mensaje,
      tipo: 'GENERAL',
    });
  }

  @Post('inventory/alertas/enviar-ahora')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forzar envío inmediato de todas las alertas (stock bajo + vencimientos)' })
  async forzarEnvioAlertas() {
    return this.alertasProgramadasService.forzarEnvioAlertas();
  }

  @Post('inventory/alertas/stock-bajo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar alerta de stock bajo por WhatsApp' })
  async enviarAlertaStockBajo() {
    return this.alertasProgramadasService.enviarAlertasStockBajo();
  }

  @Post('inventory/alertas/vencimientos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar alerta de vencimientos por WhatsApp' })
  async enviarAlertaVencimientos() {
    return this.alertasProgramadasService.enviarAlertasVencimiento();
  }

  // ==================== HISTÓRICO DE CAMBIOS (HU-30) ====================

  @Get('inventory/items/:id/historial')
  @ApiOperation({
    summary: 'Obtener historial de cambios de un ítem',
    description: 'Retorna el historial de todas las modificaciones realizadas a un ítem específico, incluyendo quién y cuándo',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Registros por página' })
  @ApiQuery({ name: 'fecha_desde', required: false, description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_hasta', required: false, description: 'Fecha fin (YYYY-MM-DD)' })
  async getHistorialCambiosItem(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
  ) {
    return this.inventarioService.getHistorialCambiosItem(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      fechaDesde,
      fechaHasta,
    );
  }

  // ==================== ALERTAS SIN MOVIMIENTOS (HU-33) ====================

  @Get('inventory/alertas/sin-movimientos')
  @ApiOperation({
    summary: 'Obtener ítems sin movimientos en n días',
    description: 'Retorna lista de ítems que no han tenido movimientos en el período especificado',
  })
  @ApiQuery({ name: 'dias', required: false, description: 'Número de días sin movimiento (default: 30)' })
  async getItemsSinMovimientos(@Query('dias') dias?: string) {
    return this.inventarioService.getItemsSinMovimientos(dias ? parseInt(dias) : 30);
  }

  // ==================== REPORTES DE INVENTARIO (HU-34) ====================

  @Get('inventory/reportes/consumo-servicio')
  @ApiOperation({
    summary: 'Reporte de consumo por servicio/examen',
    description: 'Calcula el consumo de insumos basado en los exámenes realizados',
  })
  @ApiQuery({ name: 'fecha_desde', required: false })
  @ApiQuery({ name: 'fecha_hasta', required: false })
  @ApiQuery({ name: 'codigo_categoria', required: false })
  async getReporteConsumoPorServicio(
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('codigo_categoria') codigoCategoria?: string,
  ) {
    return this.inventarioService.getReporteConsumoPorServicio(
      fechaDesde,
      fechaHasta,
      codigoCategoria ? parseInt(codigoCategoria) : undefined,
    );
  }

  @Get('inventory/reportes/compras-proveedor')
  @ApiOperation({
    summary: 'Reporte de compras por proveedor',
    description: 'Agrupa las órdenes de compra por proveedor con detalle de ítems comprados',
  })
  @ApiQuery({ name: 'fecha_desde', required: false })
  @ApiQuery({ name: 'fecha_hasta', required: false })
  @ApiQuery({ name: 'codigo_proveedor', required: false })
  async getReporteComprasPorProveedor(
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('codigo_proveedor') codigoProveedor?: string,
  ) {
    return this.inventarioService.getReporteComprasPorProveedor(
      fechaDesde,
      fechaHasta,
      codigoProveedor ? parseInt(codigoProveedor) : undefined,
    );
  }

  @Get('inventory/reportes/compras-categoria')
  @ApiOperation({
    summary: 'Reporte de compras por categoría',
    description: 'Agrupa las compras por categoría de ítem',
  })
  @ApiQuery({ name: 'fecha_desde', required: false })
  @ApiQuery({ name: 'fecha_hasta', required: false })
  async getReporteComprasPorCategoria(
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
  ) {
    return this.inventarioService.getReporteComprasPorCategoria(fechaDesde, fechaHasta);
  }

  @Get('inventory/reportes/kardex-completo')
  @ApiOperation({
    summary: 'Reporte Kardex completo para exportación',
    description: 'Genera un reporte completo del kardex con saldos iniciales, movimientos y saldos finales',
  })
  @ApiQuery({ name: 'fecha_desde', required: false })
  @ApiQuery({ name: 'fecha_hasta', required: false })
  @ApiQuery({ name: 'codigo_categoria', required: false })
  async getReporteKardexCompleto(
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('codigo_categoria') codigoCategoria?: string,
  ) {
    return this.inventarioService.getReporteKardexCompleto(
      fechaDesde,
      fechaHasta,
      codigoCategoria ? parseInt(codigoCategoria) : undefined,
    );
  }

  // ==================== EXPORTACIÓN PDF (HU-32, HU-34) ====================

  @Get('purchase-orders/:id/pdf')
  @ApiOperation({
    summary: 'Exportar orden de compra a PDF',
    description: 'Genera un documento PDF de la orden de compra para imprimir o descargar',
  })
  @ApiProduces('application/pdf')
  async exportOrdenCompraPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    return this.pdfInventarioService.generateOrdenCompraPdf(id, res);
  }

  @Get('inventory/reportes/kardex-completo/pdf')
  @ApiOperation({
    summary: 'Exportar reporte Kardex a PDF',
    description: 'Genera un documento PDF del reporte Kardex completo',
  })
  @ApiProduces('application/pdf')
  @ApiQuery({ name: 'fecha_desde', required: false })
  @ApiQuery({ name: 'fecha_hasta', required: false })
  @ApiQuery({ name: 'codigo_categoria', required: false })
  async exportKardexPdf(
    @Res() res: Response,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('codigo_categoria') codigoCategoria?: string,
  ) {
    const data = await this.inventarioService.getReporteKardexCompleto(
      fechaDesde,
      fechaHasta,
      codigoCategoria ? parseInt(codigoCategoria) : undefined,
    );
    return this.pdfInventarioService.generateKardexPdf(data, res);
  }

  @Get('inventory/reportes/compras-proveedor/pdf')
  @ApiOperation({
    summary: 'Exportar reporte de compras por proveedor a PDF',
    description: 'Genera un documento PDF del reporte de compras agrupado por proveedor',
  })
  @ApiProduces('application/pdf')
  @ApiQuery({ name: 'fecha_desde', required: false })
  @ApiQuery({ name: 'fecha_hasta', required: false })
  @ApiQuery({ name: 'codigo_proveedor', required: false })
  async exportComprasProveedorPdf(
    @Res() res: Response,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('codigo_proveedor') codigoProveedor?: string,
  ) {
    const data = await this.inventarioService.getReporteComprasPorProveedor(
      fechaDesde,
      fechaHasta,
      codigoProveedor ? parseInt(codigoProveedor) : undefined,
    );
    return this.pdfInventarioService.generateComprasProveedorPdf(data, res);
  }

  @Get('inventory/reportes/consumo-servicio/pdf')
  @ApiOperation({
    summary: 'Exportar reporte de consumo por servicio a PDF',
    description: 'Genera un documento PDF del reporte de consumo de insumos por exámenes',
  })
  @ApiProduces('application/pdf')
  @ApiQuery({ name: 'fecha_desde', required: false })
  @ApiQuery({ name: 'fecha_hasta', required: false })
  @ApiQuery({ name: 'codigo_categoria', required: false })
  async exportConsumoPdf(
    @Res() res: Response,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('codigo_categoria') codigoCategoria?: string,
  ) {
    const data = await this.inventarioService.getReporteConsumoPorServicio(
      fechaDesde,
      fechaHasta,
      codigoCategoria ? parseInt(codigoCategoria) : undefined,
    );
    return this.pdfInventarioService.generateConsumoPdf(data, res);
  }
}
