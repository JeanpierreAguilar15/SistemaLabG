import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CanchasService } from './canchas.service';

@ApiTags('canchas')
@Controller('canchas')
export class CanchasController {
  constructor(private readonly canchasService: CanchasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las canchas' })
  async findAll(@Query('tipo') tipo?: string) {
    return this.canchasService.findAll(tipo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cancha por ID' })
  async findOne(@Param('id') id: string) {
    return this.canchasService.findById(id);
  }

  @Get(':id/disponibilidad')
  @ApiOperation({ summary: 'Ver disponibilidad de una cancha por fecha' })
  async getDisponibilidad(
    @Param('id') id: string,
    @Query('fecha') fecha: string,
  ) {
    return this.canchasService.getDisponibilidad(id, fecha);
  }
}
