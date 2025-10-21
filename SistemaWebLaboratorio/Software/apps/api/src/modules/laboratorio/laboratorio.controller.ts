import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('laboratorio')
export class LaboratorioController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LAB')
  @Get('panel')
  panel() {
    return { mensaje: 'Panel del laboratorio: acceso permitido para rol LAB' };
  }
}

