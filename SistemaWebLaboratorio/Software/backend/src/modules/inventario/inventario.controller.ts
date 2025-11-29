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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventarioService } from './inventario.service';
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
  constructor(private readonly inventarioService: InventarioService) {}

  // ==================== INVENTARIO ====================

  @Get('inventory/items')
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
}
