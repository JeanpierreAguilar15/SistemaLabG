import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/roles.enum';
import { UserService } from './user.service';
import { AssignRoleDto } from './dtos/assign-role.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly users: UserService) {}

  // admin: listar usuarios básicos para gestión
  @Get()
  @Roles(Role.ADMIN)
  list() {
    return this.users.listBasic();
  }

  // admin: asignar/cambiar rol
  @Post('assign-role')
  @Roles(Role.ADMIN)
  assign(@Req() req: any, @Body() dto: AssignRoleDto) {
    return this.users.assignRole(req.user.sub, dto.cedula, dto.nombre_rol);
  }
}

