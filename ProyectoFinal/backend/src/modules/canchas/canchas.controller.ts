import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CanchasService } from './canchas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('canchas')
@Controller('canchas')
export class CanchasController {
  constructor(private readonly canchasService: CanchasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las canchas' })
  async findAll(@Query('tipo') tipo?: string, @Query('includeInactive') includeInactive?: string) {
    return this.canchasService.findAll(tipo, includeInactive === 'true');
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

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva cancha (Admin)' })
  async create(@Body() data: any) {
    return this.canchasService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una cancha (Admin)' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.canchasService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una cancha (Admin)' })
  async remove(@Param('id') id: string) {
    return this.canchasService.delete(id);
  }

  @Get(':id/horarios')
  @ApiOperation({ summary: 'Obtener horarios de una cancha' })
  async getHorarios(@Param('id') id: string) {
    return this.canchasService.getHorarios(id);
  }

  @Patch(':id/horarios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar horarios de una cancha (Admin)' })
  async updateHorarios(@Param('id') id: string, @Body() horarios: any[]) {
    return this.canchasService.updateHorarios(id, horarios);
  }
}
