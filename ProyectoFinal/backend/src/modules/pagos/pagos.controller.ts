import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PagosService } from './pagos.service';

@ApiTags('pagos')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Procesar pago de una reserva' })
  async procesarPago(@Request() req: any, @Body() createPagoDto: any) {
    return this.pagosService.procesarPago(req.user.id, createPagoDto);
  }

  @Get('mis-pagos')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener historial de pagos' })
  async getMisPagos(@Request() req: any) {
    return this.pagosService.findByUsuario(req.user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalle de un pago' })
  async findOne(@Param('id') id: string) {
    return this.pagosService.findById(id);
  }
}
