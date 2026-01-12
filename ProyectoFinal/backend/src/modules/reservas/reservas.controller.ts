import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReservasService } from './reservas.service';

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

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalle de una reserva' })
  async findOne(@Param('id') id: string) {
    return this.reservasService.findById(id);
  }

  @Patch(':id/cancelar')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar una reserva' })
  async cancelar(@Param('id') id: string, @Request() req: any) {
    return this.reservasService.cancelar(id, req.user.id);
  }
}
