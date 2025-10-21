import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('usuarios')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Solo ADMIN puede listar usuarios
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async listar() {
    return this.users.listar();
  }
}

