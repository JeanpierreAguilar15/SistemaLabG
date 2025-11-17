import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CotizacionesService } from './cotizaciones.service';
import { CotizacionPdfService } from './cotizacion-pdf.service';
import {
  CreateCotizacionDto,
  UpdateCotizacionDto,
  EstadoCotizacion,
} from './dto';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@ApiTags('Cotizaciones')
@Controller('cotizaciones')
export class CotizacionesController {
  constructor(
    private readonly cotizacionesService: CotizacionesService,
    private readonly pdfService: CotizacionPdfService,
  ) {}

  // ==================== EXÁMENES PARA COTIZACIÓN ====================

  @Get('examenes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Obtener exámenes agrupados por categoría con precios y requisitos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías con exámenes disponibles',
  })
  async getExamenesParaCotizacion() {
    return this.cotizacionesService.getExamenesParaCotizacion();
  }

  // ==================== COTIZACIONES (Paciente) ====================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Crear cotización seleccionando exámenes (Paciente)',
  })
  @ApiResponse({ status: 201, description: 'Cotización creada con éxito' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o examen sin precio' })
  @ApiResponse({ status: 404, description: 'Examen no encontrado' })
  async createCotizacion(
    @Body() data: CreateCotizacionDto,
    @CurrentUser('codigo_usuario') codigo_paciente: number,
  ) {
    return this.cotizacionesService.createCotizacion(data, codigo_paciente);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis cotizaciones (Paciente)' })
  @ApiResponse({ status: 200, description: 'Lista de cotizaciones del paciente' })
  async getMyCotizaciones(@CurrentUser('codigo_usuario') codigo_paciente: number) {
    return this.cotizacionesService.getMyCotizaciones(codigo_paciente);
  }

  @Get('mis-cotizaciones')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis cotizaciones (Paciente) - Alias' })
  @ApiResponse({ status: 200, description: 'Lista de cotizaciones del paciente' })
  async getMisCotizaciones(@CurrentUser('codigo_usuario') codigo_paciente: number) {
    return this.cotizacionesService.getMyCotizaciones(codigo_paciente);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener cotización específica (Paciente)' })
  @ApiResponse({ status: 200, description: 'Detalle de la cotización' })
  @ApiResponse({ status: 404, description: 'Cotización no encontrada' })
  async getCotizacion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('codigo_usuario') codigo_paciente: number,
  ) {
    return this.cotizacionesService.getCotizacion(id, codigo_paciente);
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Descargar PDF de cotización (Paciente)' })
  @ApiResponse({ status: 200, description: 'PDF de la cotización' })
  @ApiResponse({ status: 404, description: 'Cotización no encontrada' })
  async downloadCotizacionPdf(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('codigo_usuario') codigo_paciente: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Obtener cotización con verificación de propiedad
    const cotizacion = await this.cotizacionesService.getCotizacion(
      id,
      codigo_paciente,
    );

    // Generar PDF
    const pdfPath = await this.pdfService.generateCotizacionPdf(cotizacion);

    if (!existsSync(pdfPath)) {
      throw new Error('Error generando PDF');
    }

    const file = createReadStream(pdfPath);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=cotizacion-${cotizacion.numero_cotizacion}.pdf`,
    });

    return new StreamableFile(file);
  }

  // ==================== COTIZACIONES (Admin) ====================

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las cotizaciones (Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de todas las cotizaciones' })
  async getAllCotizaciones(
    @Query('codigo_paciente') codigo_paciente?: string,
    @Query('estado') estado?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
  ) {
    const filters: any = {};

    if (codigo_paciente) filters.codigo_paciente = parseInt(codigo_paciente);
    if (estado) filters.estado = estado;
    if (fecha_desde) filters.fecha_desde = fecha_desde;
    if (fecha_hasta) filters.fecha_hasta = fecha_hasta;

    return this.cotizacionesService.getAllCotizaciones(filters);
  }

  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar estado de cotización (Admin)' })
  @ApiResponse({ status: 200, description: 'Cotización actualizada' })
  @ApiResponse({ status: 404, description: 'Cotización no encontrada' })
  async updateCotizacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCotizacionDto,
  ) {
    return this.cotizacionesService.updateCotizacion(
      id,
      data.estado || EstadoCotizacion.PENDIENTE,
      data.observaciones,
    );
  }

  @Get('admin/estadisticas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadísticas de cotizaciones (Admin)' })
  @ApiResponse({ status: 200, description: 'Estadísticas de cotizaciones' })
  async getEstadisticas(
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
  ) {
    const filters: any = {};
    if (fecha_desde) filters.fecha_desde = fecha_desde;
    if (fecha_hasta) filters.fecha_hasta = fecha_hasta;

    return this.cotizacionesService.getEstadisticas(filters);
  }
}
