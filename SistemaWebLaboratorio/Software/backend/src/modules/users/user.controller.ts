import { Body, Controller, Get, Post, Put, Delete, Req, UseGuards, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';
import { UserService } from './user.service';
import { AssignRoleDto } from './dtos/assign-role.dto';
import { CreateUserDto } from './dtos/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly users: UserService) {}

  // admin: listar usuarios básicos para gestión
  @Get()
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  list() {
    return this.users.listBasic();
  }

  // admin: asignar/cambiar rol
  @Post('assign-role')
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  assign(@Req() req: any, @Body() dto: AssignRoleDto) {
    return this.users.assignRole(req.user.sub, dto.cedula, dto.nombre_rol);
  }

  // admin: crear rol nuevo (idempotente)
  @Post('create-role')
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  createRole(@Req() req: any, @Body() body: { nombre_rol: string }) {
    return this.users.createRole(req.user.sub, body.nombre_rol);
  }

  // admin: actualizar datos básicos del usuario
  @Post('update-basic')
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  updateBasic(
    @Req() req: any,
    @Body() body: { cedula: string; nombres?: string; apellidos?: string; email?: string; telefono?: string | null },
  ) {
    return this.users.updateBasic(req.user.sub, body);
  }

  // admin: crear nuevo usuario
  @Post()
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  createUser(
    @Req() req: any,
    @Body() body: CreateUserDto,
  ) {
    return this.users.createUser(req.user.sub, body);
  }

  // admin: obtener detalles de un usuario específico
  @Get(':cedula')
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  getUserByCedula(@Param('cedula') cedula: string) {
    return this.users.getUserByCedula(cedula);
  }

  // admin: actualizar usuario completo
  @Put(':cedula')
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  updateUser(
    @Req() req: any,
    @Param('cedula') cedula: string,
    @Body() body: {
      nombres?: string;
      apellidos?: string;
      email?: string;
      telefono?: string;
      activo?: boolean;
      rol?: string;
    },
  ) {
    return this.users.updateUser(req.user.sub, cedula, body);
  }

  // admin: cambiar estado activo/inactivo del usuario
  @Put(':cedula/toggle-status')
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  toggleUserStatus(
    @Req() req: any,
    @Param('cedula') cedula: string,
  ) {
    return this.users.toggleUserStatus(req.user.sub, cedula);
  }

  // admin: resetear contraseña de usuario
  @Put(':cedula/reset-password')
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  resetPassword(
    @Req() req: any,
    @Param('cedula') cedula: string,
    @Body() body: { newPassword: string },
  ) {
    return this.users.resetPassword(req.user.sub, cedula, body.newPassword);
  }

  // admin: eliminar usuario (soft delete)
  @Delete(':cedula')
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  deleteUser(
    @Req() req: any,
    @Param('cedula') cedula: string,
    @Query('force') force?: string,
  ) {
    const forceFlag = String(force || '').toLowerCase() === 'true' || force === '1';
    return this.users.deleteUser(req.user.sub, cedula, forceFlag);
  }

  // admin: listar todos los roles disponibles
  @Get('roles/list')
  @Roles(Role.ADMIN, Role.PERSONAL_LAB)
  listRoles() {
    return this.users.listRoles();
  }
}
