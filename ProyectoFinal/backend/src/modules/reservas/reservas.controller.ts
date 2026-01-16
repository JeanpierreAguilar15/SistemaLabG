import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReservasService } from './reservas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('reservas')
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva reserva' })
  async create(@Request() req: any, @Body() createReservaDto: any) {
    return this.reservasService.create(req.user.id, createReservaDto);
  }

  @Get('mis-reservas')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis reservas' })
  async getMisReservas(@Request() req: any) {
    return this.reservasService.findByUsuario(req.user.id);
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas las reservas (Admin)' })
  async findAll(@Query('estado') estado?: string, @Query('fecha') fecha?: string) {
    return this.reservasService.findAll(estado, fecha);
  }

  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener estadisticas del dashboard (Admin)' })
  async getDashboardStats() {
    return this.reservasService.getDashboardStats();
  }

  @Get('admin/reportes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener reportes detallados (Admin)' })
  async getReportes(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.reservasService.getReportes(fechaInicio, fechaFin);
  }

  @Patch('admin/:id/confirmar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar una reserva (Admin)' })
  async confirmar(@Param('id') id: string) {
    return this.reservasService.confirmar(id);
  }

  @Patch('admin/:id/cancelar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar una reserva (Admin)' })
  async cancelarAdmin(@Param('id') id: string) {
    return this.reservasService.cancelarAdmin(id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalle de una reserva' })
  async findOne(@Param('id') id: string) {
    return this.reservasService.findById(id);
  }

  @Get(':id/politica-cancelacion')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar politica de cancelacion para una reserva' })
  async verificarPoliticaCancelacion(@Param('id') id: string) {
    return this.reservasService.verificarPoliticaCancelacion(id);
  }

  @Patch(':id/cancelar')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar una reserva' })
  async cancelar(
    @Param('id') id: string,
    @Request() req: any,
    @Body('forzar') forzar?: boolean,
  ) {
    return this.reservasService.cancelar(id, req.user.id, forzar);
  }
}
