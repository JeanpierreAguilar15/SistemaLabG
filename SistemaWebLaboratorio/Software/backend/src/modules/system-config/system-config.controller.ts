import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { APP_ROLES } from '../auth/constants/roles.constants';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Configuración del Sistema')
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(APP_ROLES.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva configuración (Solo Admin)' })
  create(
    @Body() createConfigDto: CreateConfigDto,
    @CurrentUser('codigo_usuario') userId: number,
  ) {
    return this.systemConfigService.create(createConfigDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(APP_ROLES.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las configuraciones (Solo Admin)' })
  findAll(@Query('grupo') grupo?: string) {
    return this.systemConfigService.findAll(false, grupo);
  }

  @Get('grupos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(APP_ROLES.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener lista de grupos de configuracion' })
  getGrupos() {
    return this.systemConfigService.getGrupos();
  }

  @Get('grupo/:grupo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(APP_ROLES.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener configuraciones por grupo' })
  findByGrupo(@Param('grupo') grupo: string) {
    return this.systemConfigService.findByGrupo(grupo);
  }

  @Post('initialize-login')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(APP_ROLES.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inicializar configuraciones de login por defecto' })
  initializeLoginDefaults() {
    return this.systemConfigService.initializeLoginDefaults();
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Obtener configuraciones públicas' })
  getPublicConfig() {
    return this.systemConfigService.getPublicConfig();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(APP_ROLES.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener una configuración por ID (Solo Admin)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.systemConfigService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(APP_ROLES.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una configuración (Solo Admin)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConfigDto: UpdateConfigDto,
    @CurrentUser('codigo_usuario') userId: number,
  ) {
    return this.systemConfigService.update(id, updateConfigDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(APP_ROLES.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una configuración (Solo Admin)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('codigo_usuario') userId: number,
  ) {
    return this.systemConfigService.remove(id, userId);
  }
}
