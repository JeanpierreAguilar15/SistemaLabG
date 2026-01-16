import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PagosService } from './pagos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePagoDto } from './dto/create-pago.dto';

@ApiTags('pagos')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Procesar pago de una reserva' })
  async procesarPago(@Request() req: any, @Body() createPagoDto: CreatePagoDto) {
    return this.pagosService.procesarPago(req.user.id, createPagoDto);
  }

  @Get('mis-pagos')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener historial de pagos' })
  async getMisPagos(@Request() req: any) {
    return this.pagosService.findByUsuario(req.user.id);
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los pagos (Admin)' })
  async findAll(@Query('estado') estado?: string) {
    return this.pagosService.findAll(estado);
  }

  @Patch('admin/:id/aprobar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprobar un pago presencial (Admin)' })
  async aprobarPago(@Param('id') id: string) {
    return this.pagosService.aprobarPago(id);
  }

  @Patch('admin/:id/rechazar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rechazar un pago (Admin)' })
  async rechazarPago(@Param('id') id: string, @Body('motivo') motivo?: string) {
    return this.pagosService.rechazarPago(id, motivo);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalle de un pago' })
  async findOne(@Param('id') id: string) {
    return this.pagosService.findById(id);
  }
}
