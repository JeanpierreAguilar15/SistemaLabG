import { Controller, Get, Patch, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsuariosService } from './usuarios.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';

@ApiTags('usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get('perfil')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  async getPerfil(@Request() req: any) {
    return this.usuariosService.findById(req.user.id);
  }

  @Patch('perfil')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar perfil del usuario' })
  async updatePerfil(@Request() req: any, @Body() updateDto: UpdateUsuarioDto) {
    return this.usuariosService.update(req.user.id, updateDto);
  }

  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los usuarios (admin)' })
  @ApiQuery({ name: 'rol', required: false })
  async getAllUsuarios(@Query('rol') rol?: string) {
    return this.usuariosService.findAll(rol);
  }

  @Patch('admin/:id/toggle-activo')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activar/desactivar usuario (admin)' })
  async toggleActivo(@Param('id') id: string) {
    return this.usuariosService.toggleActivo(id);
  }
}
