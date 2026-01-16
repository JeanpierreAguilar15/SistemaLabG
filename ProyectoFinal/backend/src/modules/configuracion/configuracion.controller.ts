import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfiguracionService, ConfiguracionSistema } from './configuracion.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('configuracion')
@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener configuracion del sistema (Admin)' })
  async getConfig() {
    return this.configuracionService.getAllConfigForAdmin();
  }

  @Patch('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar configuracion del sistema (Admin)' })
  async updateConfig(@Body() updates: Partial<ConfiguracionSistema>) {
    const config = await this.configuracionService.updateConfig(updates);
    return {
      message: 'Configuracion actualizada exitosamente',
      config: await this.configuracionService.getAllConfigForAdmin(),
    };
  }
}
